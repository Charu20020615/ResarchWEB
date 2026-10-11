const fs = require("fs");
const fsp = require("fs").promises;
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const { URL } = require("url");

const db = require("./lib/db");
const auth = require("./lib/auth");
const multipart = require("./lib/multipart");
const render = require("./lib/render");
const adminUi = require("./lib/admin");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";
const uploadDir = db.getUploadDir();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const hidden = new Set([
  "server.js",
  "package.json",
  "package-lock.json",
  "railway.toml",
  ".gitignore"
]);

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXT = new Set([".mp4", ".webm"]);
const DOC_EXT = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ...IMAGE_EXT]);
const MAX_UPLOAD = 50 * 1024 * 1024;

const compressible = new Set([".html", ".css", ".js", ".svg", ".json", ".txt"]);
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
const notFoundPath = path.join(root, "404.html");
const cmsPages = new Set([
  "index.html",
  "about.html",
  "domain.html",
  "milestones.html",
  "documents.html",
  "slides.html",
  "contact.html"
]);

function resolveFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split("?")[0]);
  } catch (error) {
    return null;
  }
  if (pathname.includes("\0")) return null;
  const cleaned = pathname.replace(/^[/\\]+/, "");
  const resolved = path.resolve(root, cleaned);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

function isHidden(filePath) {
  const relative = path.relative(root, filePath);
  const parts = relative.split(path.sep);
  if (parts.some(function (part) { return part.startsWith("."); })) return true;
  if (parts[0] === "lib" || parts[0] === "data" || parts[0] === "node_modules") return true;
  return hidden.has(path.basename(filePath).toLowerCase());
}

function send(res, status, type, body, extraHeaders) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body || "", "utf8");
  res.writeHead(
    status,
    Object.assign(
      {
        "Content-Type": type,
        "Content-Length": payload.length,
        "Cache-Control": "no-cache"
      },
      securityHeaders,
      extraHeaders || {}
    )
  );
  res.end(payload);
}

function sendNotFound(res, head) {
  fs.readFile(notFoundPath, function (err, body) {
    const fallback = "<!doctype html><title>Not found</title><p>Page not found.</p>";
    const payload = err ? fallback : body;
    res.writeHead(
      404,
      Object.assign(
        {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": Buffer.byteLength(payload),
          "Cache-Control": "no-cache"
        },
        securityHeaders
      )
    );
    res.end(head ? undefined : payload);
  });
}

function redirect(res, location, cookie) {
  const headers = Object.assign({ Location: location }, securityHeaders);
  if (cookie) headers["Set-Cookie"] = cookie;
  res.writeHead(303, headers);
  res.end();
}

function safeExt(filename) {
  return path.extname(filename || "").toLowerCase();
}

function allowedFile(filename, mime, allowSet) {
  const ext = safeExt(filename);
  if (!allowSet.has(ext)) return false;
  if (mime && mime.includes("svg") && ext !== ".svg") return false;
  return true;
}

async function saveUpload(file, allowSet) {
  if (!file || !file.data || !file.data.length) return null;
  if (!allowedFile(file.filename, file.mime, allowSet)) {
    throw new Error("That file type is not allowed.");
  }
  if (file.data.length > MAX_UPLOAD) throw new Error("File is too large (max 50 MB).");
  await fsp.mkdir(uploadDir, { recursive: true });
  const ext = safeExt(file.filename);
  const stored = crypto.randomBytes(16).toString("hex") + ext;
  await fsp.writeFile(path.join(uploadDir, stored), file.data);
  return { stored: stored, mime: file.mime || types[ext] || "application/octet-stream", name: path.basename(file.filename) };
}

async function removeUpload(storedName) {
  if (!storedName) return;
  const base = path.basename(storedName);
  try {
    await fsp.unlink(path.join(uploadDir, base));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function parseForm(req) {
  return multipart.parseRequest(req, MAX_UPLOAD);
}

const SECTION_OF = { people: "team", media: "media", gallery: "gallery", milestones: "milestones", documents: "documents", slides: "slides" };

function backFor(pathname) {
  const key = String(pathname || "").split("/")[2];
  return "/admin/" + (SECTION_OF[key] || "");
}

function flashRedirect(res, message, kind, back) {
  const cookie =
    "vw_flash=" +
    encodeURIComponent(JSON.stringify({ message: message, kind: kind || "success" })) +
    "; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=30";
  redirect(res, back || "/admin", cookie);
}

function readFlash(req) {
  const cookies = {};
  (req.headers.cookie || "").split(";").forEach(function (part) {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  if (!cookies.vw_flash) return { flash: null, clearCookie: null };
  let flash = null;
  try {
    flash = JSON.parse(cookies.vw_flash);
  } catch (error) {
    flash = null;
  }
  return {
    flash: flash,
    clearCookie: "vw_flash=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0"
  };
}

async function handleAdmin(req, res, pathname) {
  const session = auth.readSession(req);
  const method = req.method || "GET";

  if (!db.isConfigured() || !auth.credentialsConfigured() || !db.isReady()) {
    send(
      res,
      200,
      "text/html; charset=utf-8",
      adminUi.setupPage(
        db.isConfigured(),
        db.isReady(),
        db.getLastError(),
        auth.credentialsConfigured()
      )
    );
    return;
  }

  if (pathname === "/admin/login" && method === "GET") {
    if (session) return redirect(res, "/admin");
    send(res, 200, "text/html; charset=utf-8", adminUi.loginPage(""));
    return;
  }

  if (pathname === "/admin/login" && method === "POST") {
    const form = await parseForm(req);
    if (auth.checkLogin(form.fields.username || "", form.fields.password || "")) {
      redirect(res, "/admin", auth.createSessionCookie(form.fields.username));
      return;
    }
    send(res, 401, "text/html; charset=utf-8", adminUi.loginPage("Invalid username or password."));
    return;
  }

  if (pathname === "/admin/logout") {
    redirect(res, "/admin/login", auth.clearSessionCookie());
    return;
  }

  if (!session) {
    redirect(res, "/admin/login");
    return;
  }

  const sectionMatch = pathname.match(/^\/admin\/(team|media|gallery|milestones|documents|slides)$/);
  if ((pathname === "/admin" || sectionMatch) && method === "GET") {
    const content = await db.getAllContent();
    const flashInfo = readFlash(req);
    const html = sectionMatch
      ? adminUi.sectionPage(sectionMatch[1], content, flashInfo.flash)
      : adminUi.overview(content, flashInfo.flash);
    send(
      res,
      200,
      "text/html; charset=utf-8",
      html,
      flashInfo.clearCookie ? { "Set-Cookie": flashInfo.clearCookie } : null
    );
    return;
  }

  const back = backFor(pathname);
  try {
    if (pathname === "/admin/people" && method === "POST") {
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.photo, IMAGE_EXT);
      await db.query(
        `INSERT INTO people (kind, name, student_id, role_label, email, component_title, description, photo_path, sort_order)
         VALUES ($1,$2,$3,'',$4,$5,$6,$7,(SELECT COALESCE(MAX(sort_order),0)+1 FROM people))`,
        [
          form.fields.kind || "member",
          form.fields.name || "",
          form.fields.student_id || "",
          form.fields.email || "",
          form.fields.component_title || "",
          form.fields.description || "",
          upload ? upload.stored : ""
        ]
      );
      return flashRedirect(res, "Person added.", "success", back);
    }

    const peopleMatch = pathname.match(/^\/admin\/people\/(\d+)(\/delete)?$/);
    if (peopleMatch && method === "POST") {
      const id = peopleMatch[1];
      const existing = await db.query("SELECT photo_path FROM people WHERE id=$1", [id]);
      if (peopleMatch[2]) {
        if (existing.rows[0]) await removeUpload(existing.rows[0].photo_path);
        await db.query("DELETE FROM people WHERE id=$1", [id]);
        return flashRedirect(res, "Person deleted.", "success", back);
      }
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.photo, IMAGE_EXT);
      let photo = existing.rows[0] ? existing.rows[0].photo_path : "";
      if (upload) {
        await removeUpload(photo);
        photo = upload.stored;
      }
      await db.query(
        `UPDATE people SET kind=$1, name=$2, student_id=$3, email=$4,
         component_title=$5, description=$6, photo_path=$7, updated_at=NOW()
         WHERE id=$8`,
        [
          form.fields.kind || "member",
          form.fields.name || "",
          form.fields.student_id || "",
          form.fields.email || "",
          form.fields.component_title || "",
          form.fields.description || "",
          photo,
          id
        ]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }

    const mediaMatch = pathname.match(/^\/admin\/media\/([a-z_]+)$/);
    if (mediaMatch && method === "POST") {
      const slot = mediaMatch[1];
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, IMAGE_EXT);
      const existing = await db.query("SELECT file_path, mime_type FROM site_media WHERE slot=$1", [slot]);
      let filePath = existing.rows[0] ? existing.rows[0].file_path : "";
      let mime = existing.rows[0] ? existing.rows[0].mime_type : "";
      if (upload) {
        await removeUpload(filePath);
        filePath = upload.stored;
        mime = upload.mime;
      }
      await db.query(
        `INSERT INTO site_media (slot, title, caption, description, file_path, mime_type, updated_at)
         VALUES ($1,$1,'',$2,$3,$4,NOW())
         ON CONFLICT (slot) DO UPDATE SET
           description=EXCLUDED.description, file_path=EXCLUDED.file_path,
           mime_type=EXCLUDED.mime_type, updated_at=NOW()`,
        [slot, form.fields.description || "", filePath, mime]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }

    if (pathname === "/admin/gallery" && method === "POST") {
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, new Set([...IMAGE_EXT, ...VIDEO_EXT]));
      if (!upload) throw new Error("Choose a photo or video to upload.");
      await db.query(
        `INSERT INTO gallery_items (title, caption, file_path, mime_type, sort_order)
         VALUES ($1,$2,$3,$4,(SELECT COALESCE(MAX(sort_order),0)+1 FROM gallery_items))`,
        [form.fields.title || "", form.fields.caption || "", upload.stored, upload.mime]
      );
      return flashRedirect(res, "Added to the gallery.", "success", back);
    }

    const galleryMatch = pathname.match(/^\/admin\/gallery\/(\d+)(\/delete)?$/);
    if (galleryMatch && method === "POST") {
      const id = galleryMatch[1];
      const existing = await db.query("SELECT file_path, mime_type FROM gallery_items WHERE id=$1", [id]);
      if (galleryMatch[2]) {
        if (existing.rows[0]) await removeUpload(existing.rows[0].file_path);
        await db.query("DELETE FROM gallery_items WHERE id=$1", [id]);
        return flashRedirect(res, "Deleted.", "success", back);
      }
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, new Set([...IMAGE_EXT, ...VIDEO_EXT]));
      let filePath = existing.rows[0].file_path;
      let mime = existing.rows[0].mime_type;
      if (upload) {
        await removeUpload(filePath);
        filePath = upload.stored;
        mime = upload.mime;
      }
      await db.query(
        `UPDATE gallery_items SET title=$1, caption=$2, file_path=$3, mime_type=$4 WHERE id=$5`,
        [form.fields.title || "", form.fields.caption || "", filePath, mime, id]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }

    const mileMatch = pathname.match(/^\/admin\/milestones\/(\d+)$/);
    if (mileMatch && method === "POST") {
      const id = mileMatch[1];
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, DOC_EXT);
      const existing = await db.query("SELECT file_path, file_name FROM milestones WHERE id=$1", [id]);
      let filePath = existing.rows[0].file_path;
      let fileName = existing.rows[0].file_name;
      if (upload) {
        await removeUpload(filePath);
        filePath = upload.stored;
        fileName = upload.name;
      }
      await db.query(
        `UPDATE milestones SET description=$1, event_date=$2, marks=$3, status_label=$4,
         file_path=$5, file_name=$6, updated_at=NOW() WHERE id=$7`,
        [
          form.fields.description || "",
          form.fields.event_date || "",
          form.fields.marks || "",
          form.fields.status_label || "",
          filePath,
          fileName,
          id
        ]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }

    if (pathname === "/admin/documents" && method === "POST") {
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, DOC_EXT);
      await db.query(
        `INSERT INTO documents (category, title, description, event_date, file_path, file_name, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,(SELECT COALESCE(MAX(sort_order),0)+1 FROM documents))`,
        [
          form.fields.category || "other",
          form.fields.title || "",
          form.fields.description || "",
          form.fields.event_date || "",
          upload ? upload.stored : "",
          upload ? upload.name : ""
        ]
      );
      return flashRedirect(res, "Document added.", "success", back);
    }

    const docMatch = pathname.match(/^\/admin\/documents\/(\d+)(\/delete)?$/);
    if (docMatch && method === "POST") {
      const id = docMatch[1];
      const existing = await db.query("SELECT file_path, file_name FROM documents WHERE id=$1", [id]);
      if (docMatch[2]) {
        if (existing.rows[0]) await removeUpload(existing.rows[0].file_path);
        await db.query("DELETE FROM documents WHERE id=$1", [id]);
        return flashRedirect(res, "Deleted.", "success", back);
      }
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, DOC_EXT);
      let filePath = existing.rows[0].file_path;
      let fileName = existing.rows[0].file_name;
      if (upload) {
        await removeUpload(filePath);
        filePath = upload.stored;
        fileName = upload.name;
      }
      await db.query(
        `UPDATE documents SET category=$1, title=$2, description=$3, event_date=$4,
         file_path=$5, file_name=$6, updated_at=NOW() WHERE id=$7`,
        [
          form.fields.category || "other",
          form.fields.title || "",
          form.fields.description || "",
          form.fields.event_date || "",
          filePath,
          fileName,
          id
        ]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }

    if (pathname === "/admin/slides" && method === "POST") {
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, DOC_EXT);
      await db.query(
        `INSERT INTO slides (slug, title, description, event_date, tag_label, file_path, file_name, sort_order)
         VALUES ('',$1,$2,$3,$4,$5,$6,(SELECT COALESCE(MAX(sort_order),0)+1 FROM slides))`,
        [
          form.fields.title || "",
          form.fields.description || "",
          form.fields.event_date || "",
          form.fields.tag_label || "",
          upload ? upload.stored : "",
          upload ? upload.name : ""
        ]
      );
      return flashRedirect(res, "Slides added.", "success", back);
    }

    const slideMatch = pathname.match(/^\/admin\/slides\/(\d+)(\/delete)?$/);
    if (slideMatch && method === "POST") {
      const id = slideMatch[1];
      const existing = await db.query("SELECT file_path, file_name FROM slides WHERE id=$1", [id]);
      if (slideMatch[2]) {
        if (existing.rows[0]) await removeUpload(existing.rows[0].file_path);
        await db.query("DELETE FROM slides WHERE id=$1", [id]);
        return flashRedirect(res, "Deleted.", "success", back);
      }
      const form = await parseForm(req);
      const upload = await saveUpload(form.files.file, DOC_EXT);
      let filePath = existing.rows[0].file_path;
      let fileName = existing.rows[0].file_name;
      if (upload) {
        await removeUpload(filePath);
        filePath = upload.stored;
        fileName = upload.name;
      }
      await db.query(
        `UPDATE slides SET title=$1, description=$2, event_date=$3, tag_label=$4,
         file_path=$5, file_name=$6, updated_at=NOW() WHERE id=$7`,
        [
          form.fields.title || "",
          form.fields.description || "",
          form.fields.event_date || "",
          form.fields.tag_label || "",
          filePath,
          fileName,
          id
        ]
      );
      return flashRedirect(res, "Saved.", "success", back);
    }
  } catch (error) {
    console.error(error);
    return flashRedirect(res, error.message || "Save failed.", "error", back);
  }

  sendNotFound(res, false);
}

async function serveUpload(req, res, name) {
  const base = path.basename(name);
  if (!base || base !== name || base.includes("..")) {
    sendNotFound(res, req.method === "HEAD");
    return;
  }
  const filePath = path.join(uploadDir, base);
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return sendNotFound(res, req.method === "HEAD");
    const ext = safeExt(base);
    res.writeHead(
      200,
      Object.assign(
        {
          "Content-Type": types[ext] || "application/octet-stream",
          "Content-Length": stat.size,
          "Cache-Control": "public, max-age=3600"
        },
        securityHeaders
      )
    );
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    sendNotFound(res, req.method === "HEAD");
  }
}

async function serveCmsPage(req, res, pageName) {
  const filePath = path.join(root, pageName);
  let html = await fsp.readFile(filePath, "utf8");
  if (db.isReady()) {
    try {
      const content = await db.getAllContent();
      html = render.applyContent(html, pageName, content);
    } catch (error) {
      console.error("CMS render failed:", error.message);
    }
  }
  const gzip = /gzip/.test(req.headers["accept-encoding"] || "");
  const headers = Object.assign(
    {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      Vary: "Accept-Encoding"
    },
    securityHeaders
  );
  if (gzip) {
    const payload = zlib.gzipSync(Buffer.from(html, "utf8"));
    headers["Content-Encoding"] = "gzip";
    headers["Content-Length"] = payload.length;
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : payload);
    return;
  }
  headers["Content-Length"] = Buffer.byteLength(html);
  res.writeHead(200, headers);
  res.end(req.method === "HEAD" ? undefined : html);
}

function serveStatic(req, res, filePath) {
  const isHead = req.method === "HEAD";
  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      sendNotFound(res, isHead);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const gzip = compressible.has(ext) && /gzip/.test(req.headers["accept-encoding"] || "");
    const revalidate = ext === ".html" || ext === ".css" || ext === ".js";
    const headers = Object.assign(
      {
        "Content-Type": types[ext] || "application/octet-stream",
        "Cache-Control": revalidate ? "no-cache" : "public, max-age=3600",
        "Last-Modified": stat.mtime.toUTCString(),
        Vary: "Accept-Encoding"
      },
      securityHeaders
    );
    const since = Date.parse(req.headers["if-modified-since"] || "");
    if (revalidate && since && Math.floor(stat.mtimeMs / 1000) * 1000 <= since) {
      res.writeHead(304, headers);
      return res.end();
    }
    if (gzip) headers["Content-Encoding"] = "gzip";
    else headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    if (isHead) return res.end();
    const stream = fs.createReadStream(filePath);
    stream.on("error", function () { res.destroy(); });
    if (gzip) stream.pipe(zlib.createGzip()).pipe(res);
    else stream.pipe(res);
  });
}

const server = http.createServer(async function (req, res) {
  try {
    const method = req.method || "GET";
    const url = new URL(req.url || "/", "http://localhost");
    let pathname = url.pathname;

    if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      await handleAdmin(req, res, pathname);
      return;
    }

    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end("Method not allowed");
      return;
    }

    if (pathname.startsWith("/uploads/")) {
      await serveUpload(req, res, pathname.slice("/uploads/".length));
      return;
    }

    const lookup = pathname === "/" ? "/index.html" : pathname;
    const pageName = path.basename(lookup);
    if (cmsPages.has(pageName) && (lookup === "/" + pageName || pathname === "/")) {
      await serveCmsPage(req, res, pageName);
      return;
    }

    const filePath = resolveFile(lookup);
    if (!filePath || isHidden(filePath)) {
      sendNotFound(res, method === "HEAD");
      return;
    }
    serveStatic(req, res, filePath);
  } catch (error) {
    console.error(error);
    send(res, 500, "text/plain; charset=utf-8", "Server error");
  }
});

async function start() {
  await fsp.mkdir(uploadDir, { recursive: true }).catch(function () {});
  const result = await db.init();
  if (!result.ok) {
    console.log("Running without database:", result.reason);
  } else {
    console.log("Database ready. Uploads at", uploadDir);
  }
  server.listen(port, host, function () {
    console.log("VisionWaste listening on http://" + host + ":" + port);
  });
}

start();

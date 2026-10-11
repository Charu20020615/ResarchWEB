const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

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
  return hidden.has(path.basename(filePath).toLowerCase());
}

const compressible = new Set([".html", ".css", ".js", ".svg", ".json", ".txt"]);

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

const notFoundPath = path.join(root, "404.html");

function sendNotFound(res, head) {
  fs.readFile(notFoundPath, function (err, body) {
    const fallback = "<!doctype html><title>Not found</title><p>Page not found.</p>";
    const payload = err ? fallback : body;
    res.writeHead(404, Object.assign({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload),
      "Cache-Control": "no-cache"
    }, securityHeaders));
    res.end(head ? undefined : payload);
  });
}

const server = http.createServer(function (req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  const requestPath = (req.url || "/").split("?")[0];
  const lookup = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = resolveFile(lookup);

  const isHead = req.method === "HEAD";

  if (!filePath || isHidden(filePath)) {
    sendNotFound(res, isHead);
    return;
  }

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      sendNotFound(res, isHead);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const gzip = compressible.has(ext) && /gzip/.test(req.headers["accept-encoding"] || "");
    const headers = Object.assign({
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
      "Vary": "Accept-Encoding"
    }, securityHeaders);

    if (gzip) headers["Content-Encoding"] = "gzip";
    else headers["Content-Length"] = stat.size;

    res.writeHead(200, headers);

    if (isHead) {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", function () { res.destroy(); });
    if (gzip) stream.pipe(zlib.createGzip()).pipe(res);
    else stream.pipe(res);
  });
});

server.listen(port, host, function () {
  console.log("VisionWaste listening on http://" + host + ":" + port);
});

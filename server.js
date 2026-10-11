const fs = require("fs");
const http = require("http");
const path = require("path");

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

function send(res, status, type, body) {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  res.end(body);
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

  if (!filePath || isHidden(filePath)) {
    send(res, 404, "text/html; charset=utf-8", "<!doctype html><title>Not found</title><p>Page not found.</p>");
    return;
  }

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      send(res, 404, "text/html; charset=utf-8", "<!doctype html><title>Not found</title><p>Page not found.</p>");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, host, function () {
  console.log("VisionWaste listening on http://" + host + ":" + port);
});

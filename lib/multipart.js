const MAX_DEFAULT = 50 * 1024 * 1024;

function readBody(req, maxBytes) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Upload exceeds the size limit."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", function () {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

function parseUrlEncoded(buf) {
  const fields = {};
  const text = buf.toString("utf8");
  new URLSearchParams(text).forEach(function (value, key) {
    fields[key] = value;
  });
  return { fields: fields, files: {} };
}

function indexOf(buf, pattern, from) {
  return buf.indexOf(pattern, from || 0);
}

function parseMultipartBuffer(buf, boundary) {
  const fields = {};
  const files = {};
  const delim = Buffer.from("--" + boundary);
  const crlf = Buffer.from("\r\n");
  let start = indexOf(buf, delim);
  if (start === -1) return { fields: fields, files: files };
  start += delim.length;
  if (buf[start] === 13 && buf[start + 1] === 10) start += 2;

  while (start < buf.length) {
    if (buf[start] === 45 && buf[start + 1] === 45) break;
    const next = indexOf(buf, Buffer.concat([crlf, delim]), start);
    const end = next === -1 ? buf.length : next;
    const part = buf.subarray(start, end);
    const headerEnd = indexOf(part, Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) break;
    const headerText = part.subarray(0, headerEnd).toString("utf8");
    let body = part.subarray(headerEnd + 4);
    if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
      body = body.subarray(0, body.length - 2);
    }

    const nameMatch = /name="([^"]+)"/i.exec(headerText);
    if (!nameMatch) {
      start = next === -1 ? buf.length : next + 2 + delim.length;
      if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
      continue;
    }
    const name = nameMatch[1];
    const fileMatch = /filename="([^"]*)"/i.exec(headerText);
    if (fileMatch) {
      const filename = fileMatch[1];
      const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
      if (filename && body.length) {
        files[name] = {
          filename: filename,
          mime: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
          data: body
        };
      }
    } else {
      fields[name] = body.toString("utf8");
    }

    if (next === -1) break;
    start = next + 2 + delim.length;
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
  }

  return { fields: fields, files: files };
}

async function parseRequest(req, maxBytes) {
  const limit = maxBytes || MAX_DEFAULT;
  const type = req.headers["content-type"] || "";
  const body = await readBody(req, limit);

  if (type.includes("application/x-www-form-urlencoded")) {
    return parseUrlEncoded(body);
  }

  if (type.includes("multipart/form-data")) {
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(type);
    if (!match) throw new Error("Missing multipart boundary.");
    const boundary = (match[1] || match[2] || "").trim();
    return parseMultipartBuffer(body, boundary);
  }

  throw new Error("Unsupported form encoding.");
}

module.exports = {
  parseRequest,
  MAX_DEFAULT
};

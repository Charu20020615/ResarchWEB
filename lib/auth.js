const crypto = require("crypto");

const COOKIE_NAME = "vw_admin";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

function secret() {
  return process.env.SESSION_SECRET || "";
}

function adminUser() {
  return process.env.ADMIN_USERNAME || "";
}

function adminPass() {
  return process.env.ADMIN_PASSWORD || "";
}

function credentialsConfigured() {
  return Boolean(secret() && adminUser() && adminPass());
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function createSessionCookie(username) {
  const exp = String(Date.now() + MAX_AGE_MS);
  const payload = username + "|" + exp;
  const token = payload + "|" + sign(payload);
  return (
    COOKIE_NAME +
    "=" +
    encodeURIComponent(token) +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    String(Math.floor(MAX_AGE_MS / 1000))
  );
}

function clearSessionCookie() {
  return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach(function (part) {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function readSession(req) {
  if (!secret()) return null;
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const username = parts[0];
  const exp = Number(parts[1]);
  const sig = parts[2];
  const payload = username + "|" + parts[1];
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch (error) {
    return null;
  }
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  if (username !== adminUser()) return null;
  return { username };
}

function checkLogin(username, password) {
  if (!credentialsConfigured()) return false;
  const uOk =
    username.length === adminUser().length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUser()));
  const pOk =
    password.length === adminPass().length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPass()));
  return uOk && pOk;
}

module.exports = {
  credentialsConfigured,
  createSessionCookie,
  clearSessionCookie,
  readSession,
  checkLogin,
  adminUser
};

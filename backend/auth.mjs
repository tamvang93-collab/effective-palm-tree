import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_SECRET = process.env.REFRESH_JWT_SECRET || `${JWT_SECRET}_refresh`;
const REFRESH_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || "30d";

export function signUserToken(user) {
  const payload = {
    sub: user.id,
    username: user.username
  };
  if (user.is_admin) {
    const role = user.admin_role === "sub" ? "sub" : "super";
    payload.adminRole = role;
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyUserToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateTokenFamily() {
  return crypto.randomUUID();
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, reason: "NO_AUTH_TOKEN" });
  }

  try {
    req.auth = verifyUserToken(token);
    return next();
  } catch {
    return res.status(401).json({ ok: false, reason: "INVALID_TOKEN" });
  }
}

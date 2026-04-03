import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import {
  authMiddleware,
  generateTokenFamily,
  hashToken,
  signRefreshToken,
  signUserToken,
  verifyRefreshToken
} from "./auth.mjs";
import { createDbConnection, runMigrations } from "./db.mjs";

function effectiveAdminRole(row) {
  if (!row?.is_admin) return null;
  return row.admin_role === "sub" ? "sub" : "super";
}

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone ?? null,
    vip: row.vip,
    balance: row.balance,
    xu: row.balance,
    coins: row.balance,
    isAdmin: Boolean(row.is_admin),
    adminRole: effectiveAdminRole(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAdminUserRow(row) {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone ?? null,
    vip: row.vip,
    balance: row.balance,
    isAdmin: Boolean(row.is_admin),
    adminRole: effectiveAdminRole(row),
    createdByAdminId: row.created_by_admin_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockUntil: row.lock_until ?? null,
    locked: Boolean(row.lock_until && new Date(row.lock_until).getTime() > Date.now())
  };
}

/** Seed admin user from env (ADMIN_USERNAME, ADMIN_PASSWORD, optional ADMIN_PHONE). Call after migrations. */
export async function seedAdminAccount(db) {
  const username = String(process.env.ADMIN_USERNAME ?? "").trim();
  const password = String(process.env.ADMIN_PASSWORD ?? "");
  if (!username || !password) return;

  const now = new Date().toISOString();
  const existing = db.prepare("SELECT * FROM users WHERE lower(username) = lower(?)").get(username);
  if (existing) {
    db.prepare("UPDATE users SET is_admin = 1, admin_role = 'super', updated_at = ? WHERE id = ?").run(now, existing.id);
    return;
  }

  let phone = String(process.env.ADMIN_PHONE ?? "").trim() || null;
  if (phone) {
    if (!/^\+84\d{9,10}$/.test(phone)) {
      // eslint-disable-next-line no-console
      console.warn("[seedAdminAccount] ADMIN_PHONE invalid, skipping phone for admin seed");
      phone = null;
    } else {
      const taken = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
      if (taken) {
        // eslint-disable-next-line no-console
        console.warn("[seedAdminAccount] ADMIN_PHONE already used, creating admin without phone");
        phone = null;
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  db.prepare(
    `INSERT INTO users (username, phone, password_hash, vip, balance, is_admin, admin_role, created_by_admin_id, failed_attempts, created_at, updated_at)
     VALUES (?, ?, ?, 0, 0, 1, 'super', NULL, 0, ?, ?)`
  ).run(username, phone, passwordHash, now, now);
}

function adminOnly(db) {
  return (req, res, next) => {
    const row = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.auth.sub);
    if (!row || !row.is_admin) {
      return res.status(403).json({ ok: false, reason: "FORBIDDEN_NOT_ADMIN" });
    }
    return next();
  };
}

function adminSuperOnly(db) {
  return (req, res, next) => {
    const row = db.prepare("SELECT is_admin, admin_role FROM users WHERE id = ?").get(req.auth.sub);
    if (!row || !row.is_admin) {
      return res.status(403).json({ ok: false, reason: "FORBIDDEN_NOT_ADMIN" });
    }
    const role = row.admin_role === "sub" ? "sub" : "super";
    if (role !== "super") {
      return res.status(403).json({ ok: false, reason: "FORBIDDEN_SUPER_ADMIN_ONLY" });
    }
    return next();
  };
}

function getSiteConfigPayload(db) {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get("config_json");
  const raw = row?.value ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const LOGIN_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000);
const LOGIN_LIMIT = Number(process.env.AUTH_RATE_LIMIT_MAX || 20);
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);
const LOCK_THRESHOLD = Number(process.env.AUTH_LOCK_THRESHOLD || 5);
const REFRESH_COOKIE_NAME = "refresh_token";

function createRateLimiter() {
  const store = new Map();
  return (key) => {
    const now = Date.now();
    const current = store.get(key) ?? { count: 0, start: now };
    if (now - current.start > LOGIN_WINDOW_MS) {
      current.count = 0;
      current.start = now;
    }
    current.count += 1;
    store.set(key, current);
    return current.count <= LOGIN_LIMIT;
  };
}

function getClientFingerprint(req) {
  const ua = req.headers["user-agent"] || "unknown";
  return `${ua}`.slice(0, 300);
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "unknown";
}

function writeAuditLog(db, { userId = null, username = null, action, status, req, detail = null }) {
  db.prepare(
    `INSERT INTO auth_logs (user_id, username, action, status, ip, user_agent, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    username,
    action,
    status,
    getClientIp(req),
    (req.headers["user-agent"] || "").toString().slice(0, 400),
    detail,
    new Date().toISOString()
  );
}

function issueSessionTokens(db, user, req, tokenFamily = generateTokenFamily()) {
  const accessToken = signUserToken(user);
  const refreshToken = signRefreshToken({
    sub: user.id,
    username: user.username,
    family: tokenFamily,
    jti: crypto.randomUUID()
  });
  const refreshHash = hashToken(refreshToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT INTO auth_sessions
    (user_id, token_family, refresh_token_hash, expires_at, revoked_at, client_fingerprint, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`
  ).run(user.id, tokenFamily, refreshHash, expiresAt, getClientFingerprint(req), now, now);

  return { accessToken, refreshToken };
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  };
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}

export function createApp(db) {
  const allowAuthAttempt = createRateLimiter();
  const app = express();
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/site-config", (_req, res) => {
    const cfg = getSiteConfigPayload(db);
    const defaults = {
      deductXuModelAll5: 10,
      deductXuModelOther: 2,
      siteTitle: "SLOSTWIN - AI",
      siteSubtitle: "HỆ THỐNG GAME"
    };
    res.json({ ok: true, config: { ...defaults, ...cfg } });
  });

  app.get("/api/admin/site-settings", authMiddleware, adminSuperOnly(db), (_req, res) => {
    res.json({ ok: true, config: getSiteConfigPayload(db) });
  });

  app.put("/api/admin/site-settings", authMiddleware, adminSuperOnly(db), (req, res) => {
    const prev = getSiteConfigPayload(db);
    const next = { ...prev, ...(req.body?.config && typeof req.body.config === "object" ? req.body.config : {}) };
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ('config_json', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(JSON.stringify(next), now);
    return res.json({ ok: true, config: next });
  });

  app.post("/api/auth/register", async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (username.length < 3) {
      return res.status(400).json({ ok: false, reason: "USERNAME_TOO_SHORT" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, reason: "PASSWORD_TOO_SHORT" });
    }
    if (phone.length === 0) {
      return res.status(400).json({ ok: false, reason: "PHONE_REQUIRED" });
    }
    if (!/^\+84\d{9,10}$/.test(phone)) {
      return res.status(400).json({ ok: false, reason: "PHONE_INVALID" });
    }

    const existed = db.prepare("SELECT id FROM users WHERE lower(username) = lower(?)").get(username);
    if (existed) {
      return res.status(409).json({ ok: false, reason: "USER_EXISTS" });
    }
    const existedPhone = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existedPhone) {
      return res.status(409).json({ ok: false, reason: "PHONE_EXISTS" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const insert = db
      .prepare(
        "INSERT INTO users (username, phone, password_hash, vip, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(username, phone, passwordHash, 0, 0, now, now);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(insert.lastInsertRowid);
    const tokens = issueSessionTokens(db, user, req);
    writeAuditLog(db, { userId: user.id, username, action: "register", status: "success", req });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
    return res.json({ ok: true, token: tokens.accessToken, user: mapUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");
    const rateKey = `${getClientIp(req)}:${username.toLowerCase()}`;
    if (!allowAuthAttempt(rateKey)) {
      writeAuditLog(db, { username, action: "login", status: "blocked_rate_limit", req });
      return res.status(429).json({ ok: false, reason: "RATE_LIMITED" });
    }

    const user = db.prepare("SELECT * FROM users WHERE lower(username) = lower(?)").get(username);

    if (!user) {
      writeAuditLog(db, { username, action: "login", status: "user_not_found", req });
      return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
    }

    if (user.lock_until && new Date(user.lock_until).getTime() > Date.now()) {
      writeAuditLog(db, { userId: user.id, username, action: "login", status: "blocked_lockout", req });
      return res.status(423).json({ ok: false, reason: "ACCOUNT_LOCKED" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_attempts ?? 0) + 1;
      let lockUntil = null;
      if (attempts >= LOCK_THRESHOLD) {
        lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
      }
      db.prepare("UPDATE users SET failed_attempts = ?, lock_until = ?, updated_at = ? WHERE id = ?")
        .run(attempts, lockUntil, new Date().toISOString(), user.id);
      writeAuditLog(db, { userId: user.id, username, action: "login", status: "invalid_password", req });
      return res.status(401).json({ ok: false, reason: lockUntil ? "ACCOUNT_LOCKED" : "INVALID_PASSWORD" });
    }

    db.prepare("UPDATE users SET failed_attempts = 0, lock_until = NULL, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), user.id);
    db.prepare("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE user_id = ? AND revoked_at IS NULL")
      .run(new Date().toISOString(), new Date().toISOString(), user.id);

    const freshUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    const tokens = issueSessionTokens(db, freshUser, req);
    writeAuditLog(db, { userId: user.id, username, action: "login", status: "success", req });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
    return res.json({ ok: true, token: tokens.accessToken, user: mapUser(freshUser) });
  });

  app.post("/api/auth/refresh", (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ ok: false, reason: "NO_REFRESH_TOKEN" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      writeAuditLog(db, { username: null, action: "refresh", status: "invalid_refresh_token", req });
      return res.status(401).json({ ok: false, reason: "INVALID_REFRESH_TOKEN" });
    }

    const hashed = hashToken(refreshToken);
    const session = db
      .prepare("SELECT * FROM auth_sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL")
      .get(hashed);
    if (!session) {
      writeAuditLog(db, { userId: payload.sub, username: payload.username, action: "refresh", status: "revoked", req });
      return res.status(401).json({ ok: false, reason: "SESSION_REVOKED" });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      db.prepare("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?")
        .run(new Date().toISOString(), new Date().toISOString(), session.id);
      writeAuditLog(db, { userId: payload.sub, username: payload.username, action: "refresh", status: "expired", req });
      return res.status(401).json({ ok: false, reason: "REFRESH_EXPIRED" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
    if (!user) return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });

    db.prepare("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), new Date().toISOString(), session.id);

    const tokens = issueSessionTokens(db, user, req, payload.family);
    writeAuditLog(db, { userId: user.id, username: user.username, action: "refresh", status: "success", req });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
    return res.json({ ok: true, token: tokens.accessToken, user: mapUser(user) });
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
    if (!user) return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
    return res.json({ ok: true, user: mapUser(user) });
  });

  app.post("/api/auth/logout", authMiddleware, (_req, res) => {
    const refreshToken = _req.cookies?.[REFRESH_COOKIE_NAME] || _req.body?.refreshToken;
    if (refreshToken) {
      db.prepare("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE refresh_token_hash = ?")
        .run(new Date().toISOString(), new Date().toISOString(), hashToken(refreshToken));
    }
    writeAuditLog(db, { userId: _req.auth.sub, username: _req.auth.username, action: "logout", status: "success", req: _req });
    clearRefreshCookie(res);
    return res.json({ ok: true });
  });

  app.post("/api/auth/logout-all", authMiddleware, (req, res) => {
    db.prepare("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE user_id = ? AND revoked_at IS NULL")
      .run(new Date().toISOString(), new Date().toISOString(), req.auth.sub);
    writeAuditLog(db, { userId: req.auth.sub, username: req.auth.username, action: "logout_all", status: "success", req });
    clearRefreshCookie(res);
    return res.json({ ok: true });
  });

  app.post("/api/user/deduct-xu", authMiddleware, (req, res) => {
    const cfg = getSiteConfigPayload(db);
    const allowedA = Number(cfg.deductXuModelAll5 ?? 10);
    const allowedB = Number(cfg.deductXuModelOther ?? 2);
    const amount = Math.max(1, Number(req.body?.amount ?? allowedA));
    if (amount !== allowedA && amount !== allowedB) {
      return res.status(400).json({ ok: false, reason: "INVALID_DEDUCT_AMOUNT" });
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
    if (!user) return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
    if (user.balance < amount) return res.status(400).json({ ok: false, reason: "INSUFFICIENT_BALANCE" });

    const nextBalance = user.balance - amount;
    db.prepare("UPDATE users SET balance = ?, updated_at = ? WHERE id = ?")
      .run(nextBalance, new Date().toISOString(), user.id);

    return res.json({ ok: true, newBalance: nextBalance });
  });

  const ADMIN_LOCK_UNTIL = new Date("2099-12-31T23:59:59.999Z").toISOString();

  app.get("/api/admin/users", authMiddleware, adminOnly(db), (req, res) => {
    const actor = db.prepare("SELECT is_admin, admin_role FROM users WHERE id = ?").get(req.auth.sub);
    const subOnly = Boolean(actor?.is_admin && actor.admin_role === "sub");
    const memberFilter = subOnly ? " AND is_admin = 0 " : "";

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const q = String(req.query.q ?? "").trim();

    let total;
    let rows;
    if (q) {
      total = db
        .prepare(
          `SELECT COUNT(*) AS c FROM users
           WHERE (instr(lower(username), lower(?)) > 0
              OR instr(lower(ifnull(phone, '')), lower(?)) > 0)
              ${memberFilter}`
        )
        .get(q, q).c;
      rows = db
        .prepare(
          `SELECT id, username, phone, vip, balance, created_at, updated_at, lock_until, is_admin, admin_role, created_by_admin_id FROM users
           WHERE (instr(lower(username), lower(?)) > 0
              OR instr(lower(ifnull(phone, '')), lower(?)) > 0)
              ${memberFilter}
           ORDER BY id DESC LIMIT ? OFFSET ?`
        )
        .all(q, q, limit, offset);
    } else {
      total = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE 1=1 ${memberFilter}`).get().c;
      rows = db
        .prepare(
          `SELECT id, username, phone, vip, balance, created_at, updated_at, lock_until, is_admin, admin_role, created_by_admin_id FROM users
           WHERE 1=1 ${memberFilter}
           ORDER BY id DESC LIMIT ? OFFSET ?`
        )
        .all(limit, offset);
    }

    return res.json({
      ok: true,
      users: rows.map(mapAdminUserRow),
      page,
      limit,
      total
    });
  });

  app.post("/api/admin/sub-admins", authMiddleware, adminSuperOnly(db), async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (username.length < 3) {
      return res.status(400).json({ ok: false, reason: "USERNAME_TOO_SHORT" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, reason: "PASSWORD_TOO_SHORT" });
    }
    if (phone.length === 0) {
      return res.status(400).json({ ok: false, reason: "PHONE_REQUIRED" });
    }
    if (!/^\+84\d{9,10}$/.test(phone)) {
      return res.status(400).json({ ok: false, reason: "PHONE_INVALID" });
    }

    const existed = db.prepare("SELECT id FROM users WHERE lower(username) = lower(?)").get(username);
    if (existed) {
      return res.status(409).json({ ok: false, reason: "USER_EXISTS" });
    }
    const existedPhone = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existedPhone) {
      return res.status(409).json({ ok: false, reason: "PHONE_EXISTS" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const insert = db
      .prepare(
        `INSERT INTO users (username, phone, password_hash, vip, balance, is_admin, admin_role, created_by_admin_id, failed_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 0, 0, 1, 'sub', ?, 0, ?, ?)`
      )
      .run(username, phone, passwordHash, req.auth.sub, now, now);

    const created = db
      .prepare(
        "SELECT id, username, phone, vip, balance, created_at, updated_at, lock_until, is_admin, admin_role, created_by_admin_id FROM users WHERE id = ?"
      )
      .get(insert.lastInsertRowid);

    writeAuditLog(db, {
      userId: req.auth.sub,
      username: req.auth.username,
      action: "admin_create_sub_admin",
      status: "success",
      req,
      detail: JSON.stringify({ targetUserId: created.id, targetUsername: username })
    });

    const host = req.get("host") || "localhost";
    const proto = req.get("x-forwarded-proto") || req.protocol || "http";
    const loginUrl = `${proto}://${host}/?admin=1`;

    return res.status(201).json({ ok: true, user: mapAdminUserRow(created), loginUrl });
  });

  app.post("/api/admin/users", authMiddleware, adminSuperOnly(db), async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (username.length < 3) {
      return res.status(400).json({ ok: false, reason: "USERNAME_TOO_SHORT" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, reason: "PASSWORD_TOO_SHORT" });
    }
    if (phone.length === 0) {
      return res.status(400).json({ ok: false, reason: "PHONE_REQUIRED" });
    }
    if (!/^\+84\d{9,10}$/.test(phone)) {
      return res.status(400).json({ ok: false, reason: "PHONE_INVALID" });
    }

    const existed = db.prepare("SELECT id FROM users WHERE lower(username) = lower(?)").get(username);
    if (existed) {
      return res.status(409).json({ ok: false, reason: "USER_EXISTS" });
    }
    const existedPhone = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existedPhone) {
      return res.status(409).json({ ok: false, reason: "PHONE_EXISTS" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const insert = db
      .prepare(
        `INSERT INTO users (username, phone, password_hash, vip, balance, is_admin, admin_role, created_by_admin_id, failed_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 0, 0, 0, NULL, NULL, 0, ?, ?)`
      )
      .run(username, phone, passwordHash, now, now);

    const created = db
      .prepare(
        "SELECT id, username, phone, vip, balance, created_at, updated_at, lock_until, is_admin, admin_role, created_by_admin_id FROM users WHERE id = ?"
      )
      .get(insert.lastInsertRowid);

    writeAuditLog(db, {
      userId: req.auth.sub,
      username: req.auth.username,
      action: "admin_create_user",
      status: "success",
      req,
      detail: JSON.stringify({ targetUserId: created.id, targetUsername: username })
    });

    return res.status(201).json({ ok: true, user: mapAdminUserRow(created) });
  });

  app.post("/api/admin/users/:id/lock", authMiddleware, adminSuperOnly(db), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, reason: "INVALID_USER_ID" });
    }
    const target = db.prepare("SELECT id, username FROM users WHERE id = ?").get(id);
    if (!target) {
      return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE users SET lock_until = ?, failed_attempts = 0, updated_at = ? WHERE id = ?").run(
      ADMIN_LOCK_UNTIL,
      now,
      id
    );

    writeAuditLog(db, {
      userId: req.auth.sub,
      username: req.auth.username,
      action: "admin_lock_user",
      status: "success",
      req,
      detail: JSON.stringify({ targetUserId: id, targetUsername: target.username })
    });

    return res.json({ ok: true });
  });

  app.post("/api/admin/users/:id/unlock", authMiddleware, adminSuperOnly(db), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, reason: "INVALID_USER_ID" });
    }
    const target = db.prepare("SELECT id, username FROM users WHERE id = ?").get(id);
    if (!target) {
      return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE users SET lock_until = NULL, failed_attempts = 0, updated_at = ? WHERE id = ?").run(now, id);

    writeAuditLog(db, {
      userId: req.auth.sub,
      username: req.auth.username,
      action: "admin_unlock_user",
      status: "success",
      req,
      detail: JSON.stringify({ targetUserId: id, targetUsername: target.username })
    });

    return res.json({ ok: true });
  });

  app.post("/api/admin/users/:id/balance-adjust", authMiddleware, adminOnly(db), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, reason: "INVALID_USER_ID" });
    }
    const delta = Number(req.body?.delta);
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
      return res.status(400).json({ ok: false, reason: "INVALID_DELTA" });
    }
    const reason = String(req.body?.reason ?? "").trim().slice(0, 500) || null;

    db.exec("BEGIN IMMEDIATE");
    let adjust;
    try {
      const target = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!target) {
        db.exec("ROLLBACK");
        return res.status(404).json({ ok: false, reason: "USER_NOT_FOUND" });
      }
      const actor = db.prepare("SELECT admin_role FROM users WHERE id = ?").get(req.auth.sub);
      if (actor?.admin_role === "sub" && target.is_admin) {
        db.exec("ROLLBACK");
        return res.status(403).json({ ok: false, reason: "FORBIDDEN_SUB_CANNOT_ADJUST_ADMIN" });
      }
      const balanceBefore = target.balance;
      const balanceAfter = balanceBefore + delta;
      if (balanceAfter < 0) {
        db.exec("ROLLBACK");
        return res.status(400).json({ ok: false, reason: "INSUFFICIENT_BALANCE" });
      }
      const now = new Date().toISOString();
      db.prepare("UPDATE users SET balance = ?, updated_at = ? WHERE id = ?").run(balanceAfter, now, id);

      db.prepare(
        `INSERT INTO admin_balance_logs
         (admin_id, target_user_id, delta, balance_before, balance_after, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(req.auth.sub, id, delta, balanceBefore, balanceAfter, reason, now);

      db.exec("COMMIT");
      adjust = { balanceAfter, balanceBefore };
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // ignore rollback errors
      }
      throw err;
    }

    writeAuditLog(db, {
      userId: req.auth.sub,
      username: req.auth.username,
      action: "admin_balance_adjust",
      status: "success",
      req,
      detail: JSON.stringify({ targetUserId: id, delta, balanceAfter: adjust.balanceAfter })
    });

    return res.json({
      ok: true,
      newBalance: adjust.balanceAfter,
      balanceBefore: adjust.balanceBefore,
      delta
    });
  });

  app.get("/api/admin/balance-logs", authMiddleware, adminOnly(db), (req, res) => {
    const actor = db.prepare("SELECT admin_role FROM users WHERE id = ?").get(req.auth.sub);
    const subOnly = actor?.admin_role === "sub";
    const adminFilter = subOnly ? "WHERE l.admin_id = ?" : "";
    const adminBind = subOnly ? [req.auth.sub] : [];

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const userId = req.query.userId != null && String(req.query.userId).length > 0 ? Number(req.query.userId) : null;

    let total;
    let rows;
    if (userId != null && Number.isFinite(userId)) {
      total = subOnly
        ? db
            .prepare(
              "SELECT COUNT(*) AS c FROM admin_balance_logs l WHERE l.target_user_id = ? AND l.admin_id = ?"
            )
            .get(userId, req.auth.sub).c
        : db
            .prepare("SELECT COUNT(*) AS c FROM admin_balance_logs l WHERE l.target_user_id = ?")
            .get(userId).c;
      rows = subOnly
        ? db
            .prepare(
              `SELECT l.*, u.username AS target_username, a.username AS admin_username
               FROM admin_balance_logs l
               JOIN users u ON u.id = l.target_user_id
               JOIN users a ON a.id = l.admin_id
               WHERE l.target_user_id = ? AND l.admin_id = ?
               ORDER BY l.id DESC
               LIMIT ? OFFSET ?`
            )
            .all(userId, req.auth.sub, limit, offset)
        : db
            .prepare(
              `SELECT l.*, u.username AS target_username, a.username AS admin_username
               FROM admin_balance_logs l
               JOIN users u ON u.id = l.target_user_id
               JOIN users a ON a.id = l.admin_id
               WHERE l.target_user_id = ?
               ORDER BY l.id DESC
               LIMIT ? OFFSET ?`
            )
            .all(userId, limit, offset);
    } else {
      total = db
        .prepare(`SELECT COUNT(*) AS c FROM admin_balance_logs l ${adminFilter}`)
        .get(...adminBind).c;
      rows = subOnly
        ? db
            .prepare(
              `SELECT l.*, u.username AS target_username, a.username AS admin_username
               FROM admin_balance_logs l
               JOIN users u ON u.id = l.target_user_id
               JOIN users a ON a.id = l.admin_id
               WHERE l.admin_id = ?
               ORDER BY l.id DESC
               LIMIT ? OFFSET ?`
            )
            .all(req.auth.sub, limit, offset)
        : db
            .prepare(
              `SELECT l.*, u.username AS target_username, a.username AS admin_username
               FROM admin_balance_logs l
               JOIN users u ON u.id = l.target_user_id
               JOIN users a ON a.id = l.admin_id
               ORDER BY l.id DESC
               LIMIT ? OFFSET ?`
            )
            .all(limit, offset);
    }

    return res.json({
      ok: true,
      logs: rows.map((r) => ({
        id: r.id,
        adminId: r.admin_id,
        adminUsername: r.admin_username,
        targetUserId: r.target_user_id,
        targetUsername: r.target_username,
        delta: r.delta,
        balanceBefore: r.balance_before,
        balanceAfter: r.balance_after,
        reason: r.reason,
        createdAt: r.created_at
      })),
      page,
      limit,
      total
    });
  });

  const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
  if (fs.existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath, { index: false }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
      }
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  return app;
}

export async function startServer() {
  const db = createDbConnection();
  runMigrations(db);
  await seedAdminAccount(db);
  const app = createApp(db);
  const port = Number(process.env.PORT || process.env.API_PORT || 4000);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on http://localhost:${port}`);
  });
}

const thisFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isMainModule = Boolean(entryFile && path.normalize(thisFile) === path.normalize(entryFile));

if (isMainModule) {
  startServer().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

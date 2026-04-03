import { apiFetch } from "./userApi";

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function adminListUsers({ q = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const response = await apiFetch(`/api/admin/users?${params.toString()}`, { method: "GET" });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_REQUEST_FAILED", payload };
  return { ok: true, ...payload };
}

export async function adminCreateUser({ username, password, phone }) {
  const response = await apiFetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ username, password, phone })
  });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_CREATE_FAILED", payload };
  return { ok: true, user: payload.user };
}

export async function adminLockUser(userId) {
  const response = await apiFetch(`/api/admin/users/${userId}/lock`, { method: "POST", body: JSON.stringify({}) });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_LOCK_FAILED", payload };
  return { ok: true, ...payload };
}

export async function adminUnlockUser(userId) {
  const response = await apiFetch(`/api/admin/users/${userId}/unlock`, { method: "POST", body: JSON.stringify({}) });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_UNLOCK_FAILED", payload };
  return { ok: true, ...payload };
}

export async function adminBalanceAdjust(userId, { delta, reason = "" }) {
  const response = await apiFetch(`/api/admin/users/${userId}/balance-adjust`, {
    method: "POST",
    body: JSON.stringify({ delta, reason })
  });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_BALANCE_FAILED", payload };
  return { ok: true, ...payload };
}

export async function adminGetSiteSettings() {
  const response = await apiFetch("/api/admin/site-settings", { method: "GET" });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "SETTINGS_FAILED", payload };
  return { ok: true, config: payload.config ?? {} };
}

export async function adminPutSiteSettings(config) {
  const response = await apiFetch("/api/admin/site-settings", {
    method: "PUT",
    body: JSON.stringify({ config })
  });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "SETTINGS_SAVE_FAILED", payload };
  return { ok: true, config: payload.config ?? {} };
}

export async function adminCreateSubAdmin({ username, password, phone }) {
  const response = await apiFetch("/api/admin/sub-admins", {
    method: "POST",
    body: JSON.stringify({ username, password, phone })
  });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "SUB_ADMIN_FAILED", payload };
  return { ok: true, user: payload.user, loginUrl: payload.loginUrl };
}

export async function adminListBalanceLogs({ userId = null, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (userId != null && userId !== "") params.set("userId", String(userId));
  params.set("page", String(page));
  params.set("limit", String(limit));
  const response = await apiFetch(`/api/admin/balance-logs?${params.toString()}`, { method: "GET" });
  const payload = await safeJson(response);
  if (!response.ok) return { ok: false, reason: payload?.reason ?? "ADMIN_LOGS_FAILED", payload };
  return { ok: true, ...payload };
}

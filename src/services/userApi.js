function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function setAuthToken(token) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("auth_token");
    return;
  }
  localStorage.setItem("auth_token", token);
}

function normalizeUser(rawUser = {}) {
  const balance = rawUser.xu ?? rawUser.balance ?? rawUser.coins ?? 0;
  const vip = rawUser.vip ?? rawUser.vip_level ?? rawUser.vipLevel ?? 0;
  const isAdmin = Boolean(rawUser.isAdmin ?? rawUser.is_admin);
  return {
    ...rawUser,
    xu: balance,
    balance,
    coins: balance,
    vip,
    vip_level: vip,
    vipLevel: vip,
    isAdmin
  };
}

function getLocalUser() {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem("current_user");
    if (!str) return null;
    return normalizeUser(JSON.parse(str));
  } catch {
    return null;
  }
}

function saveLocalUser(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem("current_user", JSON.stringify(normalizeUser(user)));
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function tryRefreshAccessToken() {
  try {
    const response = await fetchWithFallback("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();
    if (!response.ok || !payload?.token) return null;
    setAuthToken(payload.token);
    if (payload?.user) saveLocalUser(normalizeUser(payload.user));
    return payload.token;
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}, { retryOn401 = true } = {}) {
  const token = getAuthToken();
  const init = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  const response = await fetchWithFallback(path, init);

  if (response.status === 401 && retryOn401) {
    const nextToken = await tryRefreshAccessToken();
    if (!nextToken) return response;
    return fetchWithFallback(path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${nextToken}`
      }
    });
  }
  return response;
}

function getBackendFallbackUrl(requestPath) {
  // Fallback only for local API paths; avoid changing behavior for other endpoints.
  if (typeof window === "undefined") return null;
  if (typeof requestPath !== "string" || !requestPath.startsWith("/api/")) return null;

  // If we can't reach Vite proxy (/api on same origin), try calling backend directly.
  // Using window.location hostname keeps the fallback aligned with the IP you shared.
  try {
    const host = window.location.hostname;
    return `http://${host}:4000${requestPath}`;
  } catch {
    return null;
  }
}

async function fetchWithFallback(requestPath, init) {
  try {
    return await fetch(requestPath, init);
  } catch (err) {
    const fallbackUrl = getBackendFallbackUrl(requestPath);
    if (!fallbackUrl) throw err;
    return fetch(fallbackUrl, init);
  }
}


export async function registerUser({ username, password, phone }) {
  try {
    const response = await apiFetch(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, password, phone })
      },
      { retryOn401: false }
    );
    const payload = await safeJson(response);
    if (!response.ok) return { ok: false, reason: payload?.reason ?? "REGISTER_FAILED" };

    setAuthToken(payload.token);
    const user = normalizeUser(payload.user ?? {});
    saveLocalUser(user);
    return { ok: true, user, token: payload.token, source: "backend_db" };
  } catch {
    return { ok: false, reason: "NETWORK_ERROR" };
  }
}

export async function loginUser({ username, password }) {
  try {
    const response = await apiFetch(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password })
      },
      { retryOn401: false }
    );
    const payload = await safeJson(response);
    if (!response.ok) return { ok: false, reason: payload?.reason ?? "LOGIN_FAILED" };

    setAuthToken(payload.token);
    const user = normalizeUser(payload.user ?? {});
    saveLocalUser(user);
    return { ok: true, user, token: payload.token, source: "backend_db" };
  } catch {
    return { ok: false, reason: "NETWORK_ERROR" };
  }
}

export async function logoutUser() {
  if (typeof window === "undefined") return;
  try {
    await apiFetch("/api/auth/logout", { method: "POST", body: JSON.stringify({}) }, { retryOn401: false });
  } catch {
    // ignore network error during logout cleanup
  }
  setAuthToken(null);
  localStorage.removeItem("current_user");
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await apiFetch("/api/auth/me", { method: "GET", headers: { "Cache-Control": "no-cache" } });

    if (!response.ok) {
      if (response.status === 401) {
        setAuthToken(null);
        localStorage.removeItem("current_user");
      }
      return null;
    }

    const payload = await response.json();
    const user = normalizeUser(payload?.user ?? {});
    saveLocalUser(user);
    return user;
  } catch {
    return getLocalUser();
  }
}

export async function deductXu(amount = 10) {
  const token = getAuthToken();
  const localUser = getLocalUser();

  if (!token) return { ok: false, reason: "NO_AUTH" };

  try {
    const response = await apiFetch("/api/user/deduct-xu", { method: "POST", body: JSON.stringify({ amount }) });

    if (!response.ok) {
      return { ok: false, reason: "API_ERROR" };
    }

    const payload = await response.json();
    const newBalance = payload?.newBalance ?? payload?.balance;
    const next = normalizeUser({
      ...(localUser ?? {}),
      balance: typeof newBalance === "number" ? newBalance : (localUser?.balance ?? 0)
    });
    saveLocalUser(next);
    return { ok: true, user: next, simulated: false };
  } catch {
    return { ok: false, reason: "NETWORK_ERROR" };
  }
}


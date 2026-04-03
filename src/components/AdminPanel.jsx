import { useCallback, useEffect, useState } from "react";
import {
  adminBalanceAdjust,
  adminCreateSubAdmin,
  adminCreateUser,
  adminGetSiteSettings,
  adminListBalanceLogs,
  adminListUsers,
  adminLockUser,
  adminPutSiteSettings,
  adminUnlockUser
} from "../services/adminApi";

export default function AdminPanel({ onClose, adminRole = "super" }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const logLimit = 15;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ users: [], total: 0 });

  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustBusy, setAdjustBusy] = useState(false);

  const [logUserId, setLogUserId] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logs, setLogs] = useState({ logs: [], total: 0 });
  const [logsLoading, setLogsLoading] = useState(false);

  const isSub = adminRole === "sub";
  const isSuper = !isSub;

  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsSubtitle, setSettingsSubtitle] = useState("");
  const [settingsAll5, setSettingsAll5] = useState("10");
  const [settingsOther, setSettingsOther] = useState("2");
  const [settingsBusy, setSettingsBusy] = useState(false);

  const [subUsername, setSubUsername] = useState("");
  const [subPassword, setSubPassword] = useState("");
  const [subPhone, setSubPhone] = useState("+84");
  const [subBusy, setSubBusy] = useState(false);
  const [subLink, setSubLink] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await adminListUsers({ q, page, limit });
    setLoading(false);
    if (!res.ok) {
      setError(res.reason ?? "LOAD_FAILED");
      return;
    }
    setData({ users: res.users ?? [], total: res.total ?? 0 });
  }, [q, page, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const uid = logUserId.trim() === "" ? null : Number(logUserId);
    const res = await adminListBalanceLogs({
      userId: uid != null && Number.isFinite(uid) ? uid : null,
      page: logPage,
      limit: logLimit
    });
    setLogsLoading(false);
    if (!res.ok) {
      setError(res.reason ?? "LOGS_FAILED");
      return;
    }
    setLogs({ logs: res.logs ?? [], total: res.total ?? 0 });
  }, [logUserId, logPage, logLimit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    (async () => {
      const res = await adminGetSiteSettings();
      if (cancelled || !res.ok) return;
      const c = res.config ?? {};
      setSettingsTitle(String(c.siteTitle ?? ""));
      setSettingsSubtitle(String(c.siteSubtitle ?? ""));
      setSettingsAll5(String(c.deductXuModelAll5 ?? 10));
      setSettingsOther(String(c.deductXuModelOther ?? 2));
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsBusy(true);
    setError("");
    const res = await adminPutSiteSettings({
      siteTitle: settingsTitle.trim() || "SLOSTWIN - AI",
      siteSubtitle: settingsSubtitle.trim() || "HỆ THỐNG GAME",
      deductXuModelAll5: Math.max(1, Number(settingsAll5) || 10),
      deductXuModelOther: Math.max(1, Number(settingsOther) || 2)
    });
    setSettingsBusy(false);
    if (!res.ok) {
      setError(res.reason ?? "SETTINGS_SAVE_FAILED");
      return;
    }
    setError("");
    alert("Đã lưu cấu hình trang.");
  };

  const handleCreateSub = async (e) => {
    e.preventDefault();
    setSubBusy(true);
    setError("");
    setSubLink("");
    const res = await adminCreateSubAdmin({
      username: subUsername.trim(),
      password: subPassword,
      phone: subPhone.trim()
    });
    setSubBusy(false);
    if (!res.ok) {
      setError(res.reason ?? "SUB_ADMIN_FAILED");
      return;
    }
    setSubUsername("");
    setSubPassword("");
    setSubPhone("+84");
    setSubLink(res.loginUrl ?? "");
    await loadUsers();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateBusy(true);
    setError("");
    const res = await adminCreateUser({
      username: createUsername.trim(),
      password: createPassword,
      phone: createPhone.trim()
    });
    setCreateBusy(false);
    if (!res.ok) {
      setError(res.reason ?? "CREATE_FAILED");
      return;
    }
    setCreateUsername("");
    setCreatePassword("");
    setCreatePhone("");
    await loadUsers();
  };

  const handleLock = async (id) => {
    setError("");
    const res = await adminLockUser(id);
    if (!res.ok) setError(res.reason ?? "LOCK_FAILED");
    else await loadUsers();
  };

  const handleUnlock = async (id) => {
    setError("");
    const res = await adminUnlockUser(id);
    if (!res.ok) setError(res.reason ?? "UNLOCK_FAILED");
    else await loadUsers();
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const id = Number(adjustUserId);
    const delta = Number(adjustDelta);
    if (!Number.isFinite(id) || id <= 0) {
      setError("INVALID_USER_ID");
      return;
    }
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
      setError("INVALID_DELTA");
      return;
    }
    setAdjustBusy(true);
    setError("");
    const res = await adminBalanceAdjust(id, { delta, reason: adjustReason });
    setAdjustBusy(false);
    if (!res.ok) {
      setError(res.reason ?? "ADJUST_FAILED");
      return;
    }
    setAdjustDelta("");
    setAdjustReason("");
    await loadUsers();
    await loadLogs();
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / limit));
  const logTotalPages = Math.max(1, Math.ceil((logs.total || 0) / logLimit));

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/90 backdrop-blur-md px-4 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-[0.2em] text-cyan-300">
            {isSub ? "QUẢN TRỊ (PHỤ — CHỈ ± XU)" : "QUẢN TRỊ"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-bold tracking-[0.16em] hover:bg-white/10"
          >
            ĐÓNG
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm font-semibold text-rose-100">
            {error}
          </div>
        ) : null}

        {isSuper ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 text-sm font-black tracking-[0.18em] text-cyan-200">Chỉnh thông số trang (kỹ thuật)</h3>
            <form onSubmit={handleSaveSettings} className="grid gap-3 sm:grid-cols-2">
              <input
                value={settingsTitle}
                onChange={(e) => setSettingsTitle(e.target.value)}
                placeholder="Tiêu đề trang"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={settingsSubtitle}
                onChange={(e) => setSettingsSubtitle(e.target.value)}
                placeholder="Dòng phụ (subtitle)"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={settingsAll5}
                onChange={(e) => setSettingsAll5(e.target.value)}
                placeholder="Xu trừ — mô hình ALL 5"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <input
                value={settingsOther}
                onChange={(e) => setSettingsOther(e.target.value)}
                placeholder="Xu trừ — mô hình khác"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <button
                type="submit"
                disabled={settingsBusy}
                className="sm:col-span-2 rounded-lg border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-xs font-black tracking-[0.14em] text-cyan-100 disabled:opacity-50"
              >
                {settingsBusy ? "..." : "LƯU CẤU HÌNH"}
              </button>
            </form>
            <p className="mt-2 text-[0.65rem] text-white/45">
              Mức trừ xu phải khớp giữa trang và máy chủ — người chơi không thể gửi số khác.
            </p>
          </section>
        ) : null}

        {isSuper ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 text-sm font-black tracking-[0.18em] text-violet-200">Tạo admin phụ (chỉ ± xu thành viên)</h3>
            <form onSubmit={handleCreateSub} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                value={subUsername}
                onChange={(e) => setSubUsername(e.target.value)}
                placeholder="Username admin phụ"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                required
                minLength={3}
              />
              <input
                type="password"
                value={subPassword}
                onChange={(e) => setSubPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                required
                minLength={6}
              />
              <input
                value={subPhone}
                onChange={(e) => setSubPhone(e.target.value)}
                placeholder="+84..."
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={subBusy}
                className="rounded-lg border border-violet-300/30 bg-violet-400/15 px-4 py-2 text-xs font-black tracking-[0.14em] text-violet-100 disabled:opacity-50"
              >
                {subBusy ? "..." : "TẠO ADMIN PHỤ"}
              </button>
            </form>
            {subLink ? (
              <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-100">
                <p className="font-bold text-emerald-200">Link đăng nhập gửi admin phụ:</p>
                <p className="mt-1 break-all font-mono text-[0.7rem]">{subLink}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {isSuper ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-black tracking-[0.18em] text-amber-200">Tạo tài khoản</h3>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="Username"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              required
              minLength={3}
            />
            <input
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder="Mật khẩu"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              required
              minLength={6}
            />
            <input
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="+84..."
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-xs font-black tracking-[0.14em] text-emerald-100 disabled:opacity-50"
            >
              {createBusy ? "..." : "TẠO"}
            </button>
          </form>
        </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-bold text-white/60">Tìm kiếm</label>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                placeholder="Username / SĐT"
              />
            </div>
            <button
              type="button"
              onClick={() => loadUsers()}
              className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100"
            >
              Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/50">
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 pr-2">User</th>
                  <th className="py-2 pr-2">SĐT</th>
                  <th className="py-2 pr-2">Xu</th>
                  <th className="py-2 pr-2">Khóa</th>
                  {isSuper ? <th className="py-2 pr-2">Admin</th> : null}
                  <th className="py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuper ? 7 : 6} className="py-6 text-center text-white/50">
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  data.users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="py-2 pr-2 font-mono text-white/80">{u.id}</td>
                      <td className="py-2 pr-2 font-semibold">{u.username}</td>
                      <td className="py-2 pr-2 text-white/70">{u.phone ?? "—"}</td>
                      <td className="py-2 pr-2 text-emerald-200">{Number(u.balance).toLocaleString()}</td>
                      <td className="py-2 pr-2">{u.locked ? "Có" : "Không"}</td>
                      {isSuper ? <td className="py-2 pr-2">{u.isAdmin ? "Có" : "Không"}</td> : null}
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {isSuper ? (
                            u.locked ? (
                              <button
                                type="button"
                                onClick={() => handleUnlock(u.id)}
                                className="rounded border border-emerald-400/30 px-2 py-1 text-[0.65rem] font-bold text-emerald-100"
                              >
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleLock(u.id)}
                                className="rounded border border-amber-400/30 px-2 py-1 text-[0.65rem] font-bold text-amber-100"
                              >
                                Khóa
                              </button>
                            )
                          ) : (
                            <span className="text-white/35">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs">
            <span className="text-white/50">
              Trang {page}/{totalPages} — {data.total} tài khoản
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-black tracking-[0.18em] text-amber-200">Cộng / trừ xu</h3>
          <form onSubmit={handleAdjust} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              placeholder="User ID"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
              inputMode="numeric"
            />
            <input
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              placeholder="Delta (+/- số nguyên)"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Lý do (tuỳ chọn)"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm sm:col-span-2 lg:col-span-1"
            />
            <button
              type="submit"
              disabled={adjustBusy}
              className="rounded-lg border border-violet-300/30 bg-violet-400/15 px-4 py-2 text-xs font-black tracking-[0.14em] text-violet-100 disabled:opacity-50"
            >
              {adjustBusy ? "..." : "ÁP DỤNG"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-white/60">Lọc log theo user ID</label>
              <input
                value={logUserId}
                onChange={(e) => {
                  setLogUserId(e.target.value);
                  setLogPage(1);
                }}
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                placeholder="Để trống = tất cả"
              />
            </div>
            <button
              type="button"
              onClick={() => loadLogs()}
              className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100"
            >
              Làm mới log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[0.7rem]">
              <thead>
                <tr className="border-b border-white/10 uppercase tracking-wider text-white/50">
                  <th className="py-2 pr-2">Thời gian</th>
                  <th className="py-2 pr-2">Admin</th>
                  <th className="py-2 pr-2">Đích</th>
                  <th className="py-2 pr-2">Delta</th>
                  <th className="py-2 pr-2">Trước</th>
                  <th className="py-2 pr-2">Sau</th>
                  <th className="py-2">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-white/50">
                      Đang tải log...
                    </td>
                  </tr>
                ) : (
                  logs.logs.map((l) => (
                    <tr key={l.id} className="border-b border-white/5">
                      <td className="py-2 pr-2 text-white/70">{l.createdAt}</td>
                      <td className="py-2 pr-2">{l.adminUsername}</td>
                      <td className="py-2 pr-2">
                        #{l.targetUserId} {l.targetUsername}
                      </td>
                      <td className="py-2 pr-2 text-cyan-200">{l.delta > 0 ? `+${l.delta}` : l.delta}</td>
                      <td className="py-2 pr-2">{l.balanceBefore}</td>
                      <td className="py-2 pr-2">{l.balanceAfter}</td>
                      <td className="py-2 text-white/60">{l.reason ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/50">
            <span>
              Trang {logPage}/{logTotalPages} — {logs.total} bản ghi
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={logPage <= 1}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={logPage >= logTotalPages}
                onClick={() => setLogPage((p) => p + 1)}
                className="rounded border border-white/15 px-3 py-1 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";

const SAVED_LOGIN_KEY = "slostwin_saved_login_v1";

function mapReason(reason) {
  const dict = {
    USERNAME_TOO_SHORT: "Tên đăng nhập tối thiểu 3 ký tự.",
    PHONE_REQUIRED: "Số điện thoại là bắt buộc.",
    PHONE_INVALID: "Số điện thoại phải theo định dạng +84xxxxxxxxx.",
    PHONE_EXISTS: "Số điện thoại đã được sử dụng.",
    PASSWORD_TOO_SHORT: "Mật khẩu tối thiểu 6 ký tự.",
    PASSWORD_CONFIRM_MISMATCH: "Xác nhận mật khẩu không trùng khớp.",
    USER_EXISTS: "Tên đăng nhập đã tồn tại.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản.",
    INVALID_PASSWORD: "Mật khẩu không đúng.",
    ACCOUNT_LOCKED: "Tài khoản đang bị khóa tạm thời do nhập sai nhiều lần.",
    RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
    NETWORK_ERROR: "Không kết nối được đến máy chủ API."
  };
  return dict[reason] ?? "Đã xảy ra lỗi, vui lòng thử lại.";
}

export default function AuthPanel({ onLogin, onRegister, onAuthSuccess, adminEntry = false }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+84");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);

  const title = useMemo(() => (mode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ TÀI KHOẢN"), [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SAVED_LOGIN_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.username) setUsername(String(parsed.username));
      if (typeof parsed?.password === "string") setPassword(parsed.password);
      setRememberPassword(true);
    } catch {
      // ignore invalid stored data
    }
  }, []);

  const submit = async () => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password;
    const normalizedPhone = phone.trim();
    const isRegister = mode === "register";

    if (normalizedUsername.length < 3) {
      setError(mapReason("USERNAME_TOO_SHORT"));
      setSuccess("");
      return;
    }
    if (isRegister && normalizedPhone.length === 0) {
      setError(mapReason("PHONE_REQUIRED"));
      setSuccess("");
      return;
    }
    if (isRegister && !/^\+84\d{9,10}$/.test(normalizedPhone)) {
      setError(mapReason("PHONE_INVALID"));
      setSuccess("");
      return;
    }
    if (normalizedPassword.length < 6) {
      setError(mapReason("PASSWORD_TOO_SHORT"));
      setSuccess("");
      return;
    }
    if (isRegister && confirmPassword !== normalizedPassword) {
      setError(mapReason("PASSWORD_CONFIRM_MISMATCH"));
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    const action = isRegister ? onRegister : onLogin;
    try {
      const result = await action?.({
        username: normalizedUsername,
        password: normalizedPassword,
        phone: isRegister ? normalizedPhone : undefined
      });
      if (!result?.ok) {
        setError(mapReason(result?.reason));
        return;
      }
      if (mode === "login" && typeof window !== "undefined") {
        if (rememberPassword) {
          localStorage.setItem(
            SAVED_LOGIN_KEY,
            JSON.stringify({ username: normalizedUsername, password: normalizedPassword })
          );
        } else {
          localStorage.removeItem(SAVED_LOGIN_KEY);
        }
      }
      setSuccess(mode === "login" ? "Đăng nhập thành công." : "Đăng ký thành công, tài khoản đã được đăng nhập.");
      onAuthSuccess?.(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-3 w-full max-w-md overflow-hidden rounded-3xl border border-white/65 shadow-xl shadow-sky-300/35 ring-1 ring-sky-100/70">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat [transform:scale(1.1)] [filter:saturate(1.22)_contrast(1.12)_brightness(1.03)]"
        style={{ backgroundImage: "url(/kjc-logo.png)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-gradient-to-br from-white/30 via-sky-50/35 to-white/48"
      />
      <div className="relative z-10 p-5 sm:p-6">
      {adminEntry ? (
        <p className="mb-3 rounded-lg border border-violet-400/50 bg-violet-100/85 px-3 py-2 text-center text-[0.7rem] font-bold leading-snug tracking-wide text-violet-900 shadow-sm backdrop-blur-sm">
          Đăng nhập quản trị — dùng URL có tham số <span className="font-mono text-violet-700">?admin=1</span> để mở sẵn khu vực này.
        </p>
      ) : null}
      <h2 className="text-center text-xl font-black tracking-[0.2em] text-sky-800">{title}</h2>
      <div
        className="mt-5 space-y-3"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) submit();
        }}
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tên đăng nhập"
          className="w-full rounded-xl border border-sky-300/80 bg-white/92 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-[2px] focus:border-sky-500 focus:ring-2 focus:ring-sky-300/50"
        />
        {mode === "register" ? (
          <div className="relative">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại (+84...) *"
              className="w-full rounded-xl border border-sky-300/80 bg-white/92 px-3 py-2 pr-10 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-[2px] focus:border-sky-500 focus:ring-2 focus:ring-sky-300/50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-500">*</span>
          </div>
        ) : null}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full rounded-xl border border-sky-300/80 bg-white/92 px-3 py-2 pr-12 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-[2px] focus:border-sky-500 focus:ring-2 focus:ring-sky-300/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-slate-600 shadow-sm"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <span className="text-sm leading-none">{showPassword ? "🙈" : "👁️"}</span>
          </button>
        </div>
        {mode === "register" ? (
          <>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu"
                className="w-full rounded-xl border border-sky-300/80 bg-white/92 px-3 py-2 pr-12 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-[2px] focus:border-sky-500 focus:ring-2 focus:ring-sky-300/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-slate-600 shadow-sm"
                aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
              >
                <span className="text-sm leading-none">{showConfirmPassword ? "🙈" : "👁️"}</span>
              </button>
            </div>
          </>
        ) : null}
        {mode === "login" ? (
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-semibold text-slate-600 select-none">
            <input
              type="checkbox"
              checked={rememberPassword}
              onChange={(e) => setRememberPassword(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-400/50"
            />
            Lưu mật khẩu trên thiết bị này
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p> : null}
      {success ? <p className="mt-3 text-xs font-semibold text-emerald-700">{success}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-black tracking-[0.16em] text-white shadow-md transition hover:bg-sky-600 disabled:opacity-60"
      >
        {loading ? "ĐANG XỬ LÝ..." : mode === "login" ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode((prev) => (prev === "login" ? "register" : "login"));
          setError("");
          setSuccess("");
          setConfirmPassword("");
          setShowConfirmPassword(false);
        }}
        className="mt-3 w-full rounded-xl border border-sky-300/70 bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.14em] text-slate-700 transition hover:bg-white"
      >
        {mode === "login" ? "CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ" : "ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP"}
      </button>
      </div>
    </div>
  );
}

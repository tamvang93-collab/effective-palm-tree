import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function Badge({ children, tone }) {
  const tones = {
    hot: "from-orange-500 to-red-600",
    new: "from-lime-400 to-emerald-600"
  };

  return (
    <span
      className={`rounded-full bg-gradient-to-r ${tones[tone]} px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-white shadow-lg`}
    >
      {children}
    </span>
  );
}

function GameImage({ game }) {
  const imageFallback = useMemo(() => {
    if (!game?.image) return null;
    return game.image.replace(/\.(webp|png|jpe?g|jpeg)$/i, "");
  }, [game?.image]);

  const formats = ["webp", "png", "jpg", "jpeg"];
  const [formatIndex, setFormatIndex] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    setFormatIndex(0);
    setFallbackMode(false);
  }, [game?.id]);

  const resolvedSrc =
    fallbackMode
      ? (game?.fallbackImage ?? game?.image)
      : imageFallback && formats[formatIndex]
      ? `${imageFallback}.${formats[formatIndex]}`
      : game?.image;

  return (
    <img
      src={resolvedSrc}
      alt={game?.title ?? "Trò chơi"}
      className="h-[320px] w-full rounded-2xl object-cover sm:h-[360px]"
      onError={() => {
        setFormatIndex((idx) => {
          const next = idx + 1;
          if (next < formats.length) return next;
          setFallbackMode(true);
          return idx;
        });
      }}
    />
  );
}

export default function GameDetailModal({
  open,
  game,
  user,
  analyzing,
  analysisProgress,
  analysisResult,
  onClose,
  onAnalyze,
  onResetData,
  siteConfig
}) {
  const costAll5 = Number(siteConfig?.deductXuModelAll5 ?? 10);
  const costOther = Number(siteConfig?.deductXuModelOther ?? 2);
  const [points, setPoints] = useState(100);
  const [gameLink, setGameLink] = useState("");
  const [modelKey, setModelKey] = useState("manus");
  const [pendingAnalyzePayload, setPendingAnalyzePayload] = useState(null);
  const analysisCost = modelKey === "all5" ? costAll5 : costOther;
  const aiModels = [
    { id: "manus", label: "MANUS AI", logo: "MN" },
    { id: "claude", label: "CLAUDE 3.7 SONNET", logo: "CL" },
    { id: "gpt", label: "GPT-4.1", logo: "G4" },
    { id: "gemini", label: "GEMINI 2.0 FLASH", logo: "GM" },
    { id: "deepseek", label: "DEEPSEEK V3", logo: "DS" },
    { id: "all5", label: "ALL 5 MODELS", logo: "ALL" }
  ];

  useEffect(() => {
    if (open) {
      setPoints(100);
      setGameLink("");
      setModelKey("manus");
      setPendingAnalyzePayload(null);
    }
  }, [open, game?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selectedModel = aiModels.find((model) => model.id === modelKey) ?? aiModels[0];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            key="modal"
            className="h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 shadow-2xl sm:h-[820px]"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="grid h-full gap-0 sm:grid-cols-[1.2fr_1fr]">
              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
                <div className="absolute left-6 top-6 z-10 flex flex-col gap-2">
                  {game?.isHot ? <Badge tone="hot">{game?.multiplier ?? "5,000x"}</Badge> : null}
                  {game?.isNew ? <Badge tone="new">MỚI</Badge> : null}
                </div>
                <GameImage game={game} />
                {analyzing && analysisProgress?.length ? (
                  <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/70 p-4">
                    <p className="mb-2 text-[11px] font-black tracking-[0.2em] text-cyan-200">TIẾN TRÌNH PHÂN TÍCH</p>
                    <div className="space-y-1 text-[11px] font-semibold tracking-[0.12em] text-white/80">
                      {analysisProgress.map((step) => (
                        <p key={step}>[{new Date().toLocaleTimeString()}] {step}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {analysisResult ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 min-h-[260px]">
                    <p className="mb-2 text-[11px] font-black tracking-[0.2em] text-white/70">NHẬT KÝ HỆ THỐNG</p>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {analysisResult.summaryLines.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((slot) => (
                        <img
                          key={`left-analysis-${slot}`}
                          src={game?.image}
                          alt={`left-analysis-${slot}`}
                          className="h-16 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-wide text-white sm:text-xl">{game?.title ?? ""}</h3>
                    <p className="mt-1 text-xs font-semibold tracking-[0.22em] text-white/60">CHI TIẾT GAME</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-black tracking-[0.16em] text-white/80 transition hover:bg-white/10 hover:text-white"
                    aria-label="Đóng hộp thoại"
                  >
                    ĐÓNG
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold tracking-[0.18em] text-white/70">HỆ SỐ</p>
                    <p className="text-sm font-black tracking-wide text-brand-gold">{game?.multiplier ?? "-"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold tracking-[0.18em] text-cyan-100">PHÂN TÍCH CHUYÊN SÂU</p>
                    <p className="text-xs font-semibold tracking-[0.16em] text-white/70">
                      VIP {user?.vip ?? 0} • {Number(user?.balance ?? 0).toLocaleString()} XU
                    </p>
                  </div>

                  <div className="mb-2 grid grid-cols-2 gap-2">
                    {aiModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setModelKey(model.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[10px] font-black tracking-[0.14em] transition ${
                          modelKey === model.id
                            ? "border-cyan-200/80 bg-cyan-200/20 text-cyan-100"
                            : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        <span className="rounded-md border border-white/20 bg-black/30 px-1.5 py-0.5 text-[9px]">{model.logo}</span>
                        <span>{model.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2">
                    <input
                      value={gameLink}
                      onChange={(e) => setGameLink(e.target.value)}
                      placeholder="Nhập link game để phân tích..."
                      className="w-full bg-transparent text-xs font-semibold tracking-[0.12em] text-white placeholder:text-white/35 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={points}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setPoints(Number.isFinite(value) ? Math.max(1, Math.min(1000, value)) : 1);
                      }}
                      className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm font-bold tracking-wide text-white outline-none focus:border-cyan-200/40"
                    />
                    <button
                      type="button"
                      disabled={analyzing}
                      onClick={() => {
                        setPendingAnalyzePayload({ game, points, modelKey, gameLink });
                      }}
                      className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black tracking-[0.18em] text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {analyzing ? "ĐANG BẮT ĐẦU..." : "BẮT ĐẦU"}
                    </button>
                  </div>

                </div>

                {analysisResult ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">KẾT QUẢ AI</p>
                        <p className="text-base font-black tracking-wide text-emerald-300">{analysisResult.modelLabel}</p>
                      </div>
                      <div className="text-right text-[11px] font-semibold tracking-[0.16em] text-white/70">
                        <p>TIN CẬY: {analysisResult.confidence}%</p>
                        <p>THỜI GIAN: {analysisResult.elapsed}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-semibold tracking-[0.12em] text-white/75">
                      <p>GAME: {analysisResult.gameTitle}</p>
                      <p>LINK: {analysisResult.gameLink}</p>
                      <p>SỐ NGƯỜI ĐANG TRUY CẬP: {analysisResult.onlineUsers.toLocaleString()}+</p>
                      <p className="text-emerald-200">
                        TỶ LỆ THÔNG QUA {analysisResult.passRate}% TRONG {analysisResult.passWindow}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] text-cyan-200">
                            {analysisResult.codeSnippet}
                          </pre>
                          <div className="rounded-lg border border-amber-200/30 bg-amber-100/10 p-2">
                            <p className="text-[11px] font-black tracking-[0.16em] text-amber-100">BIGWIN / MEGA WIN</p>
                            <img
                              src={game?.image}
                              alt="bigwin"
                              className="mt-1 h-16 w-full rounded-md object-cover brightness-110 saturate-150"
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPoints(100);
                      setGameLink("");
                      setModelKey("manus");
                      onResetData?.();
                    }}
                    className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-xs font-black tracking-[0.18em] text-amber-100 transition hover:bg-amber-200/15"
                  >
                    RESET DỮ LIỆU
                  </button>
                </div>
              </div>
            </div>
            {pendingAnalyzePayload ? (
              <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
                <div className="w-full max-w-sm rounded-2xl border border-cyan-200/25 bg-slate-950/95 p-4 shadow-2xl">
                  <p className="text-sm font-black tracking-[0.16em] text-cyan-100">XÁC NHẬN PHÂN TÍCH</p>
                  <p className="mt-2 text-xs font-semibold tracking-[0.1em] text-white/80">
                    Mô hình: <span className="text-cyan-100">{selectedModel.label}</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-amber-200">
                    Hệ thống sẽ trừ {analysisCost} XU cho lần phân tích này.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingAnalyzePayload(null)}
                      className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-black tracking-[0.14em] text-white/80 transition hover:bg-white/10"
                    >
                      HỦY
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const payload = pendingAnalyzePayload;
                        setPendingAnalyzePayload(null);
                        onAnalyze?.(payload);
                      }}
                      className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black tracking-[0.14em] text-slate-950 transition hover:brightness-105"
                    >
                      XÁC NHẬN
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


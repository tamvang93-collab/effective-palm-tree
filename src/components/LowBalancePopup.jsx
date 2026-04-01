import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export default function LowBalancePopup({ open, currentBalance = 0, requiredBalance = 10, onClose, onDeposit }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
            key="popup"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/15 bg-slate-950/90 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-amber-200/15 via-amber-200/5 to-transparent px-6 py-4">
              <p className="text-xs font-black tracking-[0.24em] text-amber-100">CẢNH BÁO</p>
              <h3 className="mt-1 text-lg font-black tracking-wide text-white">THIẾU XU</h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm font-semibold leading-relaxed text-white/80">
                Số dư không đủ để thực hiện thao tác này. Vui lòng nạp thêm xu để tiếp tục.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-white/70">
                  XU HIỆN CÓ: <span className="font-black text-white">{currentBalance}</span>
                </p>
                <p className="mt-1 text-xs font-semibold tracking-[0.14em] text-amber-200">
                  YÊU CẦU TỐI THIỂU: <span className="font-black">{requiredBalance}</span>
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => onDeposit?.()}
                  className="rounded-2xl bg-brand-gold px-4 py-3 text-sm font-black tracking-[0.18em] text-slate-950 transition hover:brightness-110"
                >
                  ĐI NẠP
                </button>
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-black tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


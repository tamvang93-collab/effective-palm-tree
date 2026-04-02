import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const POS_KEY = "slostwin_fab_pos_v2";
const RADIUS = 118;

function satelliteOffsets(count) {
  const start = -52;
  const end = 52;
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const deg = start + (end - start) * t;
    const rad = (deg * Math.PI) / 180;
    list.push({
      x: Math.cos(rad) * RADIUS,
      y: -Math.sin(rad) * RADIUS
    });
  }
  return list;
}

const ITEMS = [
  {
    id: "cskh",
    label: "CSKH 24/7",
    href: "#",
    ring: "ring-orange-400/50",
    gradient: "from-orange-500 via-amber-500 to-orange-600",
    icon: <span className="text-lg leading-none">🎧</span>
  },
  {
    id: "hotline",
    label: "HOTLINE 0772486666",
    href: "tel:+840772486666",
    ring: "ring-emerald-400/50",
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    icon: <span className="text-lg leading-none">📞</span>
  },
  {
    id: "telegram",
    label: "KÊNH TELEGRAM",
    href: "https://t.me/MINHLONGXX88",
    ring: "ring-cyan-400/50",
    gradient: "from-cyan-500 via-sky-500 to-blue-700",
    icon: <span className="text-base leading-none">✈️</span>
  },
  {
    id: "facebook",
    label: "FACEBOOK",
    href: "https://www.facebook.com",
    ring: "ring-blue-900/60",
    gradient: "from-[#1e3a5f] via-[#1877f2] to-[#0d47a1]",
    icon: <span className="text-lg font-black leading-none">f</span>
  }
];

function clampPos(x, y) {
  if (typeof window === "undefined") return { x, y };
  const pad = 190; // đảm bảo các nút vệ tinh không bị ra ngoài khung nhìn
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.min(Math.max(pad, x), w - pad),
    y: Math.min(Math.max(pad, y), h - pad)
  };
}

export default function FloatingSupportMenu() {
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);

  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const offsets = useMemo(() => satelliteOffsets(ITEMS.length), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPos(clampPos(parsed.x, parsed.y));
          setReady(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setPos(clampPos(window.innerWidth - 220, window.innerHeight - 220));
    setReady(true);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const target = e.target;

      // Đừng kéo khi người dùng bấm vào nút vệ tinh (link).
      if (target?.closest?.("[data-fab-satellite]")) return;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y
      };
      dragMovedRef.current = false;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos.x, pos.y]
  );

  const onPointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 4) dragMovedRef.current = true;
      setPos(clampPos(d.originX + dx, d.originY + dy));
    },
    []
  );

  const onPointerUp = useCallback(
    (e) => {
      const d = dragRef.current;
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (!d) return;

      if (dragMovedRef.current) {
        // Kéo xong: lưu vị trí, GIỮ nguyên trạng thái open để không “mất” phần liên hệ.
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(pos));
        } catch {
          // ignore
        }
        // Chặn toggle do click xảy ra ngay sau khi thả.
        setTimeout(() => {
          dragMovedRef.current = false;
        }, 150);
      }
    },
    [pos]
  );

  const toggleOpen = useCallback(() => {
    // Nếu click là hệ quả sau khi kéo thì bỏ qua.
    if (dragMovedRef.current) return;
    setOpen((v) => !v);
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[55]" style={{ touchAction: "none" }}>
      <div
        className="pointer-events-auto absolute"
        style={{
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)"
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative h-0 w-0">
          <AnimatePresence>
            {open
              ? ITEMS.map((item, i) => {
                  const o = offsets[i] ?? { x: 0, y: 0 };
                  return (
                    <motion.a
                      key={item.id}
                      data-fab-satellite
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      initial={{ opacity: 0, scale: 0.45 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.45 }}
                      transition={{ type: "spring", stiffness: 440, damping: 30, delay: i * 0.028 }}
                      className={`absolute flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-gradient-to-b ${item.gradient} ${item.ring} text-center shadow-[0_10px_28px_rgba(0,0,0,0.45)] ring-2 ring-inset hover:brightness-110 active:scale-95`}
                      style={{
                        left: o.x,
                        top: o.y,
                        transform: "translate(-50%, -50%)",
                        zIndex: 10 - i
                      }}
                      title={item.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span className="text-white drop-shadow">{item.icon}</span>
                      <span className="mt-0.5 max-w-[68px] px-0.5 text-[7px] font-black leading-tight tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                        {item.label}
                      </span>
                    </motion.a>
                  );
                })
              : null}
          </AnimatePresence>

          <motion.button
            type="button"
            data-fab-trigger
            aria-expanded={open}
            aria-label="Hỗ trợ 24/7 — nhấn để mở menu"
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            className="absolute left-0 top-0 z-20 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 p-[3px] shadow-[0_12px_36px_rgba(37,99,235,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)] ring-[5px] ring-amber-300/95"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-b from-sky-300/95 to-blue-700/95 shadow-inner">
              <span className="text-lg font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
                24/7
              </span>
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}


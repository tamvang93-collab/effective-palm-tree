import { motion } from "framer-motion";

export default function ProviderCard({ provider, onOpen }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(provider)}
      className="group relative aspect-square overflow-hidden rounded-xl border border-amber-300/35 bg-slate-900/80 p-1 text-left shadow-[0_0_0_1px_rgba(250,204,21,0.15),0_0_24px_rgba(250,204,21,0.16)] transition-all duration-300 hover:border-amber-200/70 hover:shadow-[0_0_0_1px_rgba(253,224,71,0.35),0_0_30px_rgba(250,204,21,0.28)]"
    >
      {provider.isActive ? (
        <span className="absolute right-3 top-3 z-20 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.14em] text-slate-950 animate-pulseSoft">
          HOẠT ĐỘNG
        </span>
      ) : null}

      <div className="relative h-full overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-slate-950/25" />
        <div className="flex h-full w-full items-center justify-center p-4">
          <img
            src={provider.image}
            alt={provider.name}
            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-amber-200/20" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2.5">
        <p className="truncate text-sm font-bold tracking-wide text-white">{provider.name}</p>
        <div className="mt-2 inline-flex items-center justify-center rounded-full bg-cyan-400 px-3 py-1 text-[11px] font-extrabold text-slate-950 shadow-md shadow-cyan-400/40">
          {provider.shortName}
        </div>
      </div>
    </motion.button>
  );
}

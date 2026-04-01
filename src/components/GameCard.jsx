import { motion } from "framer-motion";
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

export default function GameCard({ game, id, onOpen }) {
  const imageFallback = useMemo(() => {
    if (!game?.image) return null;
    // Remove current extension so we can swap between webp/png/jpg/jpeg.
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
    <motion.article
      whileHover={{ scale: 1.045, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group cursor-pointer"
      id={id}
      onClick={() => onOpen?.(game)}
    >
      <div className="relative rounded-2xl bg-gold-frame p-[3px] shadow-gold">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={resolvedSrc}
            alt={game.title}
            className="h-56 w-full object-cover sm:h-60 xl:h-64"
            onError={() => {
              setFormatIndex((idx) => {
                const next = idx + 1;
                if (next < formats.length) return next;
                setFallbackMode(true);
                return idx;
              });
            }}
          />
          <div className="absolute left-2 top-2 flex flex-col gap-2">
            {game.isHot ? <Badge tone="hot">{game.multiplier ?? "5,000x"}</Badge> : null}
            {game.isNew ? <Badge tone="new">MỚI</Badge> : null}
          </div>
        </div>
      </div>
      <p className="pt-3 text-center text-sm font-extrabold tracking-wide text-white transition-colors duration-300 group-hover:text-brand-gold">
        {game.title}
      </p>
    </motion.article>
  );
}

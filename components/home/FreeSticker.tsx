"use client";

import { motion } from "framer-motion";

// A round "Free forever!" sticker slapped onto the hero: springs in, wiggles on
// hover. Purely decorative fun (MotionConfig respects reduced motion).
export function FreeSticker({ className = "", size = 104 }: { className?: string; size?: number }) {
  return (
    <motion.span
      className={`grid shrink-0 cursor-default select-none place-items-center rounded-full bg-streak text-center shadow-[0_5px_0_var(--streak-edge)] ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 12 }}
      whileHover={{ rotate: [12, -8, 18, 6, 12], scale: 1.08, transition: { duration: 0.5 } }}
      transition={{ type: "spring", bounce: 0.6, duration: 0.8, delay: 0.5 }}
    >
      <span
        className="grid h-[86%] w-[86%] place-items-center rounded-full border-2 border-dashed border-[#1d2130]/35"
        aria-label="Free forever"
      >
        <span className="leading-none" aria-hidden="true">
          <span className="block font-display text-[26px] font-extrabold tracking-[-0.03em] text-[#1d2130]" style={{ fontSize: size * 0.26 }}>
            FREE
          </span>
          <span className="mt-0.5 block font-display font-extrabold text-[#1d2130]" style={{ fontSize: size * 0.135 }}>
            forever! ✨
          </span>
        </span>
      </span>
    </motion.span>
  );
}

"use client";

import { motion } from "framer-motion";
import { Caveat } from "next/font/google";

const hand = Caveat({ subsets: ["latin"], weight: ["700"], display: "swap" });

// A hand-scribbled "free, forever!" margin note with a curly arrow that draws
// itself toward the headline. Decorative fun, not an official badge.
export function FreeNote({
  arrow = true,
  arrowSide = "left",
  className = ""
}: {
  arrow?: boolean;
  // Which side of the words the arrow sits on (it always curls down toward the headline).
  arrowSide?: "left" | "right";
  className?: string;
}) {
  const arrowEl = arrow ? (
    <motion.svg width="64" height="54" viewBox="0 0 64 54" fill="none" aria-hidden="true" className={`mb-[-14px] text-brand-text ${arrowSide === "right" ? "-scale-x-100" : ""}`} initial="hidden" animate="shown">
          <motion.path
            d="M60 8 C 40 4, 18 10, 14 30 C 12 40, 14 46, 16 50"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
          />
          <motion.path
            d="M8 42 L16 51 L23 43"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{ hidden: { pathLength: 0, opacity: 0 }, shown: { pathLength: 1, opacity: 1 } }}
            transition={{ duration: 0.25, delay: 1.55 }}
          />
        </motion.svg>
  ) : null;

  return (
    // Callers set the display (e.g. "inline-flex lg:hidden"), so responsive hiding works.
    <span className={`pointer-events-none select-none items-end gap-1 ${className}`} aria-label="Free, forever">
      {arrowSide === "left" ? arrowEl : null}
      <motion.span
        className={`${hand.className} relative inline-block text-[30px] leading-none text-brand-text`}
        initial={{ opacity: 0, scale: 0.6, rotate: -14 }}
        animate={{ opacity: 1, scale: 1, rotate: -6 }}
        transition={{ type: "spring", bounce: 0.55, duration: 0.7, delay: 0.6 }}
        aria-hidden="true"
      >
        free, forever!
        {/* squiggly underline */}
        <svg viewBox="0 0 120 10" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-2.5 w-full text-streak" aria-hidden="true">
          <path d="M2 6 Q 12 1, 22 6 T 42 6 T 62 6 T 82 6 T 102 6 T 118 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.span>
      {arrowSide === "right" ? arrowEl : null}
    </span>
  );
}

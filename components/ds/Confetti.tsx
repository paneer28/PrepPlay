"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

const COLORS = ["var(--brand)", "var(--correct)", "var(--streak)", "var(--wrong)", "var(--brand-tint)"];
const COUNT = 90;

// Deterministic per burst so rendering stays pure.
function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Change `burst` (e.g. increment it) to fire. `origin` is a viewport point in
// px (e.g. the centre of the element that was tapped); without it the burst
// comes from the upper middle of the screen. Renders nothing with reduced motion.
export function Confetti({ burst, origin }: { burst: number; origin?: { x: number; y: number } }) {
  const reduce = useReducedMotion();
  // Remove the pieces once they've all landed so nothing lingers in the page.
  const [finished, setFinished] = useState(0);
  const landed = useRef(0);
  const pieces = useMemo(() => {
    const random = seeded(burst + 1);
    return Array.from({ length: COUNT }, (_, index) => {
      const angle = -Math.PI / 2 + (random() - 0.5) * Math.PI * 0.9;
      const speed = 260 + random() * 360;
      return {
        id: index,
        color: COLORS[index % COLORS.length],
        width: 6 + random() * 6,
        height: 10 + random() * 8,
        dx: Math.cos(angle) * speed,
        rise: Math.sin(angle) * speed * 0.9,
        fall: 380 + random() * 320,
        spin: (random() - 0.5) * 900,
        delay: random() * 0.12,
        duration: 1.5 + random() * 0.7,
        round: random() > 0.7
      };
    });
  }, [burst]);

  if (reduce || burst === 0 || finished === burst) return null;

  return (
    <div key={burst} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className={`absolute block ${origin ? "" : "left-1/2 top-[38%]"}`}
          style={{ ...(origin ? { left: origin.x, top: origin.y } : null), width: piece.width, height: piece.round ? piece.width : piece.height, background: piece.color, borderRadius: piece.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, piece.dx * 0.8, piece.dx],
            y: [0, piece.rise, piece.rise + piece.fall],
            rotate: piece.spin,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: ["easeOut", "easeIn"], times: [0, 0.35, 1] }}
          onAnimationComplete={() => {
            landed.current += 1;
            if (landed.current >= COUNT) {
              landed.current = 0;
              setFinished(burst);
            }
          }}
        />
      ))}
    </div>
  );
}

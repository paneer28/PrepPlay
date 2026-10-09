"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Honors the system "reduce motion" setting site-wide: Framer Motion drops
// transform animations (slides, scales) and keeps opacity cross-fades.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

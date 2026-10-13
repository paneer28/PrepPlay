"use client";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

// Expands to its natural height with a critically damped spring. Springs start
// from the current on-screen height, so clicking again mid-motion just reverses
// it. Content stays mounted (keeping its state) and is hidden from focus and
// screen readers once closed. With `lazy`, nothing mounts until first opened.
export function Collapse({ open, id, lazy = false, children }: { open: boolean; id?: string; lazy?: boolean; children: ReactNode }) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);

  return (
    <motion.div
      id={id}
      initial={false}
      animate={
        open
          ? { height: "auto", opacity: 1, visibility: "visible" }
          : { height: 0, opacity: 0, transitionEnd: { visibility: "hidden" } }
      }
      transition={{ type: "spring", bounce: 0, duration: 0.35, opacity: { duration: 0.2 } }}
      style={{ overflow: "hidden" }}
      aria-hidden={!open}
    >
      {lazy && !opened ? null : children}
    </motion.div>
  );
}

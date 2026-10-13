"use client";
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, type PanInfo } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

// Same projection iOS uses for scroll deceleration: where a flick would come
// to rest if left alone.
function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Mobile bottom sheet. Enters and leaves through the bottom edge, drags from
// its grabber 1:1 (with rubber-banding above the top), and on release decides
// dismiss vs. settle from the projected resting point, handing the finger's
// velocity to the spring so there's no seam between dragging and animating.
export function BottomSheet({
  open,
  onClose,
  label,
  title,
  className = "",
  children
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = sheetRef.current?.offsetHeight ?? 400;
    const projected = y.get() + project(info.velocity.y);
    // Snap points are "open" (0) and "closed" (height): go to the nearer one.
    if (projected > height / 2) {
      onClose();
    } else {
      // A flick carried momentum, so a touch of bounce reads as physical.
      animate(y, 0, { type: "spring", bounce: 0.2, duration: 0.4, velocity: info.velocity.y });
    }
  };

  return (
    <AnimatePresence onExitComplete={() => y.set(0)}>
      {open ? (
        <div key="sheet" className="fixed inset-0 z-40 flex items-end md:hidden">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`relative flex max-h-[85vh] w-full flex-col rounded-t-card border-t-[1.5px] border-rule bg-page ${className}`}
            style={{ y }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 1 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <div
              className="shrink-0 cursor-grab touch-none px-6 pb-3 pt-2.5 active:cursor-grabbing"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <span aria-hidden className="mx-auto block h-1.5 w-10 rounded-full bg-rule-strong" />
              <div className="mt-3 flex items-center justify-between gap-4">
                {title ? <p className="font-display text-h4 font-extrabold text-fg">{title}</p> : <span />}
                <button type="button" onClick={onClose} className="rounded-control px-3 py-2 text-small font-bold text-brand-text transition-colors hover:bg-surface">
                  Close
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

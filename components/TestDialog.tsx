"use client";

import { useEffect, useRef, type ReactNode } from "react";

const primaryButton =
  "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95";
const secondaryButton =
  "rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]";

// Modal confirmation used by the practice test screens. Escape or a click
// outside cancels; focus starts on the cancel button so Enter is safe.
export function TestDialog({
  eyebrow,
  warning = false,
  title,
  children,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  eyebrow: string;
  warning?: boolean;
  title: string;
  children?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-dialog-title"
        className="surface w-full max-w-md p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <p className={warning ? "text-xs font-semibold uppercase tracking-[0.18em] text-amber-700" : "eyebrow"}>
          {eyebrow}
        </p>
        <h2 id="test-dialog-title" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">
          {title}
        </h2>
        {children}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className={secondaryButton}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={primaryButton}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

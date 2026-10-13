"use client";

import { WarningIcon } from "@phosphor-icons/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ds/Button";

// Modal confirmation used by the practice test screens. Escape or a click
// outside cancels; focus starts on the cancel button so Enter is safe.
export function TestDialog({
  eyebrow,
  warning = false,
  danger = false,
  title,
  children,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  eyebrow: string;
  warning?: boolean;
  // Destructive confirm (e.g. delete): red confirm button.
  danger?: boolean;
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
    <div className="ds animate-scrim-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-dialog-title"
        aria-describedby="test-dialog-eyebrow"
        className="animate-dialog-in w-full max-w-md rounded-card border-[1.5px] border-rule bg-page p-6 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="test-dialog-eyebrow" className={`flex items-center gap-1.5 text-label font-bold ${warning ? "text-wrong-text" : "text-fg-muted"}`}>
          {warning ? <WarningIcon size={16} weight="bold" aria-hidden="true" /> : null}
          {eyebrow}
        </p>
        <h2 id="test-dialog-title" className="mt-1.5 font-display text-h3 font-extrabold text-fg">
          {title}
        </h2>
        {children}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FlagIcon } from "@phosphor-icons/react";
import type { MouseEventHandler } from "react";

// The Flag / Flagged toggle shown beside the question number.
export function FlagButton({ flagged, onClick }: { flagged: boolean; onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={flagged}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-3 text-small font-bold transition-colors ${
        flagged ? "bg-streak-tint text-streak-text" : "text-fg-muted hover:bg-surface hover:text-fg"
      }`}
    >
      <FlagIcon size={16} weight={flagged ? "fill" : "bold"} aria-hidden="true" className={flagged ? "text-streak" : ""} />
      {flagged ? "Flagged" : "Flag"}
    </button>
  );
}

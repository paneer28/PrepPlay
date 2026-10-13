import type { ComponentProps } from "react";

export type NavCellState = { answered: boolean; flagged: boolean; current: boolean; result?: "correct" | "wrong" | null };

// One square in the question navigator grid.
export function NavCell({ number, answered, flagged, current, result = null, className = "", ...props }: NavCellState & { number: number } & Omit<ComponentProps<"button">, "children">) {
  const tone = result === "correct"
    ? "border-correct-fill bg-correct-fill text-white"
    : result === "wrong"
      ? "border-wrong-fill bg-wrong-fill text-white"
      : flagged
    ? "border-streak-edge bg-streak text-[#1d2130]"
    : answered
      ? "border-brand-edge bg-brand text-white"
      : "border-rule bg-page text-fg-muted hover:border-rule-strong";

  return (
    <button
      type="button"
      aria-current={current ? "step" : undefined}
      aria-label={`Question ${number}${result ? `, ${result === "correct" ? "correct" : "incorrect"}` : answered ? ", answered" : ""}${flagged ? ", flagged" : ""}`}
      className={`relative grid h-10 w-10 place-items-center rounded-[10px] border-[1.5px] font-body text-small font-extrabold tabular-nums transition-colors ${tone} ${
        current ? "outline outline-[2.5px] outline-offset-2 outline-fg" : ""
      } ${className}`}
      {...props}
    >
      {number}
      {/* Flagged and answered: an amber cell gets a brand dot; a checked (green/red) cell gets an amber dot. */}
      {flagged && answered ? (
        <span aria-hidden="true" className={`absolute right-1 top-1 h-2 w-2 rounded-full border border-white ${result ? "bg-streak" : "bg-brand"}`} />
      ) : null}
    </button>
  );
}

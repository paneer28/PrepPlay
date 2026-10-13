import type { ComponentProps } from "react";

export type NavCellState = { answered: boolean; flagged: boolean; current: boolean };

// One square in the question navigator grid.
export function NavCell({ number, answered, flagged, current, ...props }: NavCellState & { number: number } & Omit<ComponentProps<"button">, "children">) {
  const tone = flagged
    ? "border-streak-edge bg-streak text-[#1d2130]"
    : answered
      ? "border-brand-edge bg-brand text-white"
      : "border-rule bg-page text-fg-muted hover:border-rule-strong";

  return (
    <button
      type="button"
      aria-current={current ? "step" : undefined}
      aria-label={`Question ${number}${answered ? ", answered" : ""}${flagged ? ", flagged" : ""}`}
      className={`grid h-10 w-10 place-items-center rounded-[10px] border-[1.5px] font-body text-small font-extrabold tabular-nums transition-colors ${tone} ${
        current ? "outline outline-[2.5px] outline-offset-2 outline-fg" : ""
      }`}
      {...props}
    >
      {number}
    </button>
  );
}

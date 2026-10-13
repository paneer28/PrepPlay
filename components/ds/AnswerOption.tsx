"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

type Props = {
  letter: string;
  state?: AnswerState;
  // Keyboard key shown on desktop, e.g. "1" or "A".
  shortcut?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "children">;

export function AnswerOption({ letter, state = "idle", shortcut, children, type = "button", ...props }: Props) {
  const isResult = state === "correct" || state === "wrong";

  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={props.role ? undefined : state === "selected" || undefined}
      className="option"
      {...props}
    >
      <span className="option-badge" aria-hidden="true">
        {state === "correct" ? <CheckIcon size={18} weight="bold" /> : state === "wrong" ? <XIcon size={18} weight="bold" /> : letter}
      </span>
      <span className="min-w-0 flex-1">
        <span className="sr-only">{letter}. </span>
        {children}
        {isResult ? <span className="sr-only">{state === "correct" ? " (correct answer)" : " (your answer, wrong)"}</span> : null}
      </span>
      {shortcut && !isResult ? (
        <kbd
          aria-hidden="true"
          className="hidden h-6 min-w-6 flex-none place-items-center rounded-md border-[1.5px] border-b-[3px] border-rule px-1.5 font-body text-label font-bold text-fg-muted md:grid"
        >
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

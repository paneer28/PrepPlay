"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

type Props = {
  letter: string;
  state?: AnswerState;
  // Keyboard key shown on desktop, e.g. "1" or "A".
  shortcut?: string;
  // Small label on the right, e.g. "Your answer" in a review.
  note?: string;
  // Read-only (answer review): renders a plain element instead of a button.
  readOnly?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "children">;

function Badge({ letter, state }: { letter: string; state: AnswerState }) {
  return (
    <span className="option-badge" aria-hidden="true">
      {state === "correct" ? <CheckIcon size={18} weight="bold" /> : state === "wrong" ? <XIcon size={18} weight="bold" /> : letter}
    </span>
  );
}

export function AnswerOption({ letter, state = "idle", shortcut, note, readOnly = false, children, type = "button", ...props }: Props) {
  const isResult = state === "correct" || state === "wrong";
  const noteTone = state === "correct" ? "text-correct-text" : state === "wrong" ? "text-wrong-text" : "text-fg-muted";

  const content = (
    <>
      <Badge letter={letter} state={state} />
      <span className="min-w-0 flex-1">
        <span className="sr-only">{letter}. </span>
        {children}
        {isResult && !note ? <span className="sr-only">{state === "correct" ? " (correct answer)" : " (your answer, wrong)"}</span> : null}
      </span>
      {note ? <span className={`flex-none text-label font-extrabold ${noteTone}`}>{note}</span> : null}
      {shortcut && !isResult && !readOnly ? (
        <kbd
          aria-hidden="true"
          className="hidden h-6 min-w-6 flex-none place-items-center rounded-md border-[1.5px] border-b-[3px] border-rule px-1.5 font-body text-label font-bold text-fg-muted md:grid"
        >
          {shortcut}
        </kbd>
      ) : null}
    </>
  );

  if (readOnly) {
    return (
      <div data-state={state} className="option cursor-default">
        {content}
      </div>
    );
  }

  return (
    <button type={type} data-state={state} aria-pressed={props.role ? undefined : state === "selected" || undefined} className="option" {...props}>
      {content}
    </button>
  );
}

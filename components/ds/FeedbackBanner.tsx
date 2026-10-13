"use client";

import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ds/Button";

type Props = {
  tone: "correct" | "wrong";
  // "C. Charge a premium price" — shown when the answer was wrong.
  correctAnswer?: ReactNode;
  explanation?: ReactNode;
  continueLabel?: string;
  onContinue?: () => void;
  className?: string;
};

export function FeedbackBanner({ tone, correctAnswer, explanation, continueLabel = "Continue", onContinue, className = "" }: Props) {
  const correct = tone === "correct";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-slide-up rounded-card border-[1.5px] p-5 sm:p-6 ${
        correct ? "border-correct/40 bg-correct-tint" : "border-wrong/40 bg-wrong-tint"
      } ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h3 className={`flex items-center gap-2 font-display text-h4 ${correct ? "text-correct-text" : "text-wrong-text"}`}>
            {correct ? <CheckCircleIcon size={28} weight="fill" aria-hidden="true" /> : <XCircleIcon size={28} weight="fill" aria-hidden="true" />}
            {correct ? "Correct!" : "Not quite"}
          </h3>
          {!correct && correctAnswer ? (
            <p className="font-bold text-wrong-text">Correct answer: {correctAnswer}</p>
          ) : null}
          {explanation ? <p className="text-small text-fg">{explanation}</p> : null}
        </div>
        {onContinue ? (
          <Button variant={correct ? "success" : "danger"} size="lg" onClick={onContinue} className="w-full flex-none sm:w-auto">
            {continueLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

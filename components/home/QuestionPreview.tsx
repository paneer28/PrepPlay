"use client";

import { FlameIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button } from "@/components/ds/Button";

export type PreviewQuestion = {
  label: string; // "Business Law · BL:069"
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

const KEYS = ["A", "B", "C", "D"] as const;

// The home page's sample question. It looks like a screenshot, but it's a
// small easter egg: Continue really moves on to more questions you can answer.
export function QuestionPreview({ questions }: { questions: PreviewQuestion[] }) {
  const [index, setIndex] = useState(0);
  // The first question starts already answered (correctly), like the mockup.
  const [picked, setPicked] = useState<string | null>(questions[0]?.answer ?? null);
  const done = index >= questions.length;
  const question = questions[Math.min(index, questions.length - 1)];
  const count = 34 + index;

  const next = () => {
    setIndex((value) => value + 1);
    setPicked(null);
  };

  const stateFor = (key: string): AnswerState => {
    if (!picked) return "idle";
    if (key === question.answer) return "correct";
    return key === picked ? "wrong" : "dimmed";
  };

  const correct = picked === question.answer;

  return (
    <figure className="relative mx-auto max-w-[560px] px-2 pt-6 sm:px-6" aria-label="Try a practice question">
      <div className="overflow-hidden rounded-[20px] border-[1.5px] border-rule bg-page shadow-[0_6px_0_var(--rule)]">
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center gap-4" aria-hidden="true">
            <XIcon size={20} weight="bold" className="shrink-0 text-fg-muted" />
            <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-track">
              <div className="relative h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${count}%` }}>
                <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/35" />
              </div>
            </div>
            <span className="text-small font-extrabold tabular-nums text-fg">{count}/100</span>
          </div>

          {done ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-[44px]" aria-hidden="true">
                🔥
              </p>
              <p className="font-display text-h3 font-extrabold text-fg">You&apos;re on a roll!</p>
              <p className="text-small text-fg-muted">That was just a taste. Real exams have 100 questions like these.</p>
            </div>
          ) : (
            <>
              <p className="text-label font-bold text-fg-muted">{question.label}</p>
              <p className="font-body text-[19px] font-bold leading-snug text-fg sm:text-[21px]">{question.question}</p>
              <div className="space-y-2.5" role="radiogroup" aria-label="Answer choices">
                {KEYS.map((key) => (
                  <AnswerOption
                    key={`${index}-${key}`}
                    letter={key}
                    state={stateFor(key)}
                    role="radio"
                    aria-checked={picked === key}
                    aria-disabled={picked ? true : undefined}
                    onClick={() => !picked && setPicked(key)}
                  >
                    {question.options[key]}
                  </AnswerOption>
                ))}
              </div>
            </>
          )}
        </div>

        {done ? (
          <div className="flex flex-col gap-3 bg-brand-tint px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="font-display text-h4 font-extrabold text-brand-text">Ready for the real thing?</p>
            <Link href="/tests" className="btn shrink-0">
              Take a full exam
            </Link>
          </div>
        ) : picked ? (
          <div
            role="status"
            className={`animate-slide-up flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 ${
              correct ? "bg-correct-tint" : "bg-wrong-tint"
            }`}
          >
            <div className="min-w-0">
              <p className={`font-display text-h4 font-extrabold ${correct ? "text-correct-text" : "text-wrong-text"}`}>
                {correct ? "Correct!" : "Not quite"}
              </p>
              <p className="text-small text-fg">
                {correct ? "" : `Answer: ${question.answer}. `}
                {question.explanation}
              </p>
            </div>
            <Button variant={correct ? "success" : "danger"} onClick={next} className="shrink-0">
              Continue
            </Button>
          </div>
        ) : (
          <div className="bg-surface px-5 py-5 text-small font-bold text-fg-muted sm:px-7">Tap an answer to check it.</div>
        )}
      </div>

      <FloatingCard className="-right-1 top-0 rotate-[4deg] border-streak shadow-[0_4px_0_var(--streak-edge)] sm:-right-3">
        <span className="flex items-center gap-2 px-1 font-display text-small font-extrabold text-fg">
          <FlameIcon size={20} weight="fill" className="text-streak" />
          12-day streak
        </span>
      </FloatingCard>

      {/* Only on the opening question: once you Continue it would cover the answers. */}
      {index === 0 ? (
        <FloatingCard className="-left-1 bottom-[150px] w-[200px] -rotate-[4deg] shadow-[0_4px_0_var(--brand-tint)] sm:-left-8">
          <span className="block px-1 text-label font-extrabold text-fg">Economics</span>
          <span className="mt-1.5 flex items-center gap-2 px-1">
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
              <span className="block h-full w-[92%] rounded-full bg-correct" />
            </span>
            <span className="text-label font-extrabold tabular-nums text-fg">92%</span>
          </span>
        </FloatingCard>
      ) : null}
    </figure>
  );
}

// Decorative and never in the way of a tap.
function FloatingCard({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute rounded-[14px] border-[1.5px] border-rule bg-page px-3 py-2.5 motion-safe:animate-float ${className}`}>
      {children}
    </div>
  );
}

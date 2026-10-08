import type { ReactNode } from "react";
import { formatTestMeta } from "@/lib/test-format";
import type { TestOptionKey, TestQuestion } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];

// One reviewed question: options marked right/wrong, explanation, and PI. Used
// on the results screen and the dashboard's attempt detail view.
export function QuestionReviewCard({
  id,
  label,
  question,
  chosen,
  children
}: {
  id?: string;
  label: string;
  question: TestQuestion;
  chosen: TestOptionKey | null;
  children?: ReactNode;
}) {
  const isCorrect = chosen === question.answer;
  const pi = question.performanceIndicator;

  return (
    <article id={id} className="scroll-mt-28 rounded-[1.6rem] border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
            isCorrect ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {isCorrect ? "Correct" : chosen ? "Incorrect" : "Unanswered"}
        </span>
      </div>

      {question.origin ? (
        <p className="mt-2 text-sm text-muted">
          From <span className="font-semibold text-ink">{question.origin.title}</span>
          {formatTestMeta(question.origin) ? ` · ${formatTestMeta(question.origin)}` : ""} · original question{" "}
          {question.origin.number}
        </p>
      ) : null}

      <h3 className="mt-3 whitespace-pre-line text-lg font-semibold leading-8 text-ink">{question.question}</h3>

      <ul className="mt-4 grid gap-2">
        {OPTION_KEYS.map((key) => {
          const isAnswer = key === question.answer;
          const isChosen = key === chosen;
          const style = isAnswer ? "border-green-200 bg-green-50" : isChosen ? "border-red-200 bg-red-50" : "border-line bg-white";

          return (
            <li key={key} className={`flex items-start gap-3 rounded-[1.1rem] border px-4 py-3 ${style}`}>
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isAnswer
                    ? "bg-green-500 text-white"
                    : isChosen
                      ? "bg-red-400 text-white"
                      : "border border-line bg-[#f5f7fb] text-muted"
                }`}
              >
                {key}
              </span>
              <span className="flex-1 pt-0.5 text-base leading-7 text-ink">{question.options[key]}</span>
              {isAnswer || isChosen ? (
                <span
                  className={`shrink-0 pt-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                    isAnswer ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isAnswer && isChosen ? "Your answer ✓" : isAnswer ? "Correct answer" : "Your answer"}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 surface-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Explanation</p>
        <p className="mt-2 whitespace-pre-line text-base leading-7 text-ink">{question.explanation}</p>
        {question.source ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            <span className="font-semibold text-ink">Source:</span> {question.source}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-line bg-accentSoft px-3 py-1 font-semibold text-accent">{pi.code}</span>
        {pi.text ? <span className="text-ink">{pi.text}</span> : null}
        {pi.instructionalArea || pi.level ? (
          <span className="text-muted">· {[pi.instructionalArea, pi.level].filter(Boolean).join(" · ")}</span>
        ) : null}
      </div>

      {children}
    </article>
  );
}

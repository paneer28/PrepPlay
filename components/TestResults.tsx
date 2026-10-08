"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TestProgressBar } from "@/components/TestProgressBar";
import type { RunnerContext } from "@/components/PracticeTestRunner";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { useCustomSessionLauncher } from "@/components/useCustomSessionLauncher";
import { formatTestMeta, questionRef } from "@/lib/test-format";
import { newCustomSession, type TestAttempt } from "@/lib/test-progress";
import type { PracticeTest, TestOptionKey } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];

type AreaScore = {
  area: string;
  correct: number;
  total: number;
};

function percentOf(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function toneFor(percent: number) {
  return percent >= 80 ? "good" : percent >= 60 ? "warn" : "bad";
}

export function TestResults({
  test,
  attempt,
  context,
  onRetake
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  context: RunnerContext;
  onRetake: () => void;
}) {
  const [incorrectOnly, setIncorrectOnly] = useState(false);

  const graded = useMemo(
    () =>
      test.questions.map((question) => {
        const chosen = attempt.answers[question.number] ?? null;
        return { question, chosen, isCorrect: chosen === question.answer };
      }),
    [attempt.answers, test.questions]
  );

  const correctCount = graded.filter((item) => item.isCorrect).length;
  const unansweredCount = graded.filter((item) => !item.chosen).length;
  const total = graded.length;
  const percent = percentOf(correctCount, total);

  // Weakest areas first so users see what to study.
  const areaScores = useMemo(() => {
    const byArea = new Map<string, AreaScore>();

    for (const { question, isCorrect } of graded) {
      const area = question.performanceIndicator.instructionalArea?.trim() || "Other";
      const entry = byArea.get(area) ?? { area, correct: 0, total: 0 };
      entry.total += 1;
      entry.correct += isCorrect ? 1 : 0;
      byArea.set(area, entry);
    }

    return Array.from(byArea.values()).sort(
      (left, right) =>
        left.correct / left.total - right.correct / right.total || left.area.localeCompare(right.area)
    );
  }, [graded]);

  const reviewItems = incorrectOnly ? graded.filter((item) => !item.isCorrect) : graded;
  const missed = graded.filter((item) => !item.isCorrect);
  const { launch, dialog } = useCustomSessionLauncher();

  // Missed (wrong or skipped) questions become a custom session. Questions from a
  // custom session point back to their original test via `origin`.
  const practiceMissed = () => {
    const refs = missed.map(({ question }) =>
      question.origin
        ? questionRef(question.origin.testId, question.origin.number)
        : questionRef(test.id, question.number)
    );
    launch(newCustomSession(refs, `Missed questions from ${test.title}`));
  };

  return (
    <div className="space-y-8">
      <HeroFadeIn>
        <section className="surface overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line/80 bg-[linear-gradient(135deg,#f1f6ff,#f9fbff)] p-7 sm:p-9">
            <div>
              <p className="eyebrow">Results</p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{test.title}</h1>
              <p className="mt-2 text-base text-muted">{[test.cluster, context.subtitle].filter(Boolean).join(" · ")}</p>
              {attempt.timedOut ? (
                <p className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-800">
                  Time ran out. The test was submitted automatically.
                </p>
              ) : null}
            </div>
            <div className="rounded-[1.6rem] border border-line bg-white px-6 py-5 shadow-card">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Score</p>
              <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-ink">{percent}%</p>
              <p className="text-sm text-muted">
                {correctCount} of {total} correct
                {unansweredCount > 0 ? ` · ${unansweredCount} unanswered` : ""}
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-ink">By instructional area</h2>
                <p className="mt-1 text-sm text-muted">Weakest areas are listed first.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {areaScores.map((area) => {
                const areaPercent = percentOf(area.correct, area.total);

                return (
                  <div key={area.area} className="surface-soft p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-ink">{area.area}</p>
                      <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                        {area.correct}/{area.total}
                        <span className="ml-2 font-medium text-muted">{areaPercent}%</span>
                      </p>
                    </div>
                    <div className="mt-3">
                      <TestProgressBar
                        value={area.correct}
                        max={area.total}
                        tone={toneFor(areaPercent)}
                        label={`${area.area} score`}
                      />
                    </div>
                    <Link
                      href={`/tests/custom?area=${encodeURIComponent(area.area)}`}
                      className="mt-3 inline-flex text-sm font-semibold text-accent transition hover:underline"
                    >
                      Practice this area →
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRetake}
                className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
              >
                Retake test
              </button>
              {missed.length > 0 ? (
                <button
                  type="button"
                  onClick={practiceMissed}
                  className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                >
                  Practice the questions I missed ({missed.length})
                </button>
              ) : null}
              <Link
                href={context.backHref}
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
              >
                Back to {context.backLabel.toLowerCase()}
              </Link>
            </div>
          </div>
        </section>
      </HeroFadeIn>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 p-7 sm:px-9">
          <div>
            <p className="eyebrow">Answer review</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">Question by question</h2>
          </div>
          <div className="inline-flex rounded-full border border-line bg-[#f5f7fb] p-1 text-sm font-semibold">
            {[
              { label: "All questions", value: false },
              { label: `Incorrect only (${total - correctCount})`, value: true }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={incorrectOnly === option.value}
                onClick={() => setIncorrectOnly(option.value)}
                className={`rounded-full px-4 py-2 transition ${
                  incorrectOnly === option.value ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-7 sm:p-9">
          {reviewItems.length === 0 ? (
            <p className="rounded-[1.4rem] border border-green-200 bg-green-50 px-5 py-4 text-base font-semibold text-green-800">
              No incorrect answers. Nice work!
            </p>
          ) : null}

          {reviewItems.map(({ question, chosen, isCorrect }) => {
            const pi = question.performanceIndicator;

            return (
              <article key={question.number} className="rounded-[1.6rem] border border-line bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Question {question.number}
                  </p>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      isCorrect
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {isCorrect ? "Correct" : chosen ? "Incorrect" : "Unanswered"}
                  </span>
                </div>

                {question.origin ? (
                  <p className="mt-2 text-sm text-muted">
                    From <span className="font-semibold text-ink">{question.origin.title}</span>
                    {formatTestMeta(question.origin) ? ` · ${formatTestMeta(question.origin)}` : ""} · original
                    question {question.origin.number}
                  </p>
                ) : null}

                <h3 className="mt-3 text-lg font-semibold leading-8 text-ink">{question.question}</h3>

                <ul className="mt-4 grid gap-2">
                  {OPTION_KEYS.map((key) => {
                    const isAnswer = key === question.answer;
                    const isChosen = key === chosen;
                    const style = isAnswer
                      ? "border-green-200 bg-green-50"
                      : isChosen
                        ? "border-red-200 bg-red-50"
                        : "border-line bg-white";

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
                  <p className="mt-2 text-base leading-7 text-ink">{question.explanation}</p>
                  {question.source ? (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="font-semibold text-ink">Source:</span> {question.source}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full border border-line bg-accentSoft px-3 py-1 font-semibold text-accent">
                    {pi.code}
                  </span>
                  {pi.text ? <span className="text-ink">{pi.text}</span> : null}
                  {pi.instructionalArea || pi.level ? (
                    <span className="text-muted">
                      · {[pi.instructionalArea, pi.level].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {dialog}
    </div>
  );
}

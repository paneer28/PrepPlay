"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MissedNoteField } from "@/components/MissedNoteField";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { TestProgressBar } from "@/components/TestProgressBar";
import type { RunnerContext } from "@/components/PracticeTestRunner";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { useCustomSessionLauncher } from "@/components/useCustomSessionLauncher";
import { questionRef } from "@/lib/test-format";
import { newCustomSession, newId, type TestAttempt } from "@/lib/test-progress";
import type { SaveStatus } from "@/lib/test-results-shared";
import { toUpload, uploadAttempts } from "@/lib/test-sync";
import type { PracticeTest } from "@/types";

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
  onRetake,
  onAttemptChange
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  context: RunnerContext;
  onRetake: () => void;
  onAttemptChange: (patch: Partial<TestAttempt>) => void;
}) {
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const saveStatus = useSaveToAccount(attempt, context, onAttemptChange);

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
          <SaveStatusBanner status={saveStatus} />
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

          {reviewItems.map(({ question, chosen, isCorrect }) => (
            <QuestionReviewCard key={question.number} label={`Question ${question.number}`} question={question} chosen={chosen}>
              {!isCorrect && saveStatus === "saved" && attempt.id ? (
                <MissedNoteField
                  attemptId={attempt.id}
                  position={question.number}
                  initialNote={attempt.notes?.[question.number] ?? ""}
                  onSaved={(note) => onAttemptChange({ notes: { ...attempt.notes, [question.number]: note } })}
                />
              ) : null}
            </QuestionReviewCard>
          ))}
        </div>
      </section>
      {dialog}
    </div>
  );
}

// Saves a submitted result to the signed-in account once. Results that can't be
// saved now (signed out, offline) stay in the browser and are imported later
// from the dashboard.
function useSaveToAccount(
  attempt: TestAttempt,
  context: RunnerContext,
  onAttemptChange: (patch: Partial<TestAttempt>) => void
): SaveStatus | "saving" {
  const [status, setStatus] = useState<SaveStatus | "saving">(attempt.syncedAt ? "saved" : "saving");
  const started = useRef(false);

  useEffect(() => {
    if (started.current || attempt.syncedAt) return;
    started.current = true;

    const id = attempt.id ?? newId();
    if (!attempt.id) onAttemptChange({ id });

    uploadAttempts([toUpload({ ...attempt, id }, context.upload)]).then(({ status: result }) => {
      setStatus(result);
      if (result === "saved") onAttemptChange({ syncedAt: new Date().toISOString() });
    });
  }, [attempt, context.upload, onAttemptChange]);

  return status;
}

function SaveStatusBanner({ status }: { status: SaveStatus | "saving" }) {
  if (status === "saved") {
    return (
      <p className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 bg-[#f8fbff] px-7 py-3 text-sm text-muted sm:px-9">
        <span>Saved to your dashboard. Add notes to missed questions below.</span>
        <Link href="/account?tab=tests" className="font-semibold text-accent hover:underline">
          View dashboard →
        </Link>
      </p>
    );
  }

  if (status === "signed-out") {
    return (
      <p className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 bg-[#f8fbff] px-7 py-3 text-sm text-muted sm:px-9">
        <span>Sign in to save your results to your dashboard and add notes to missed questions.</span>
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in →
        </Link>
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="border-b border-amber-200 bg-amber-50 px-7 py-3 text-sm text-amber-800 sm:px-9">
        Couldn&apos;t save this result to your account right now. It will be saved the next time you open your dashboard.
      </p>
    );
  }

  return null;
}

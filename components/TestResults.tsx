"use client";

import { ArrowRightIcon, CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Confetti } from "@/components/ds/Confetti";
import { Illustration } from "@/components/ds/Illustration";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { Tag } from "@/components/ds/Tag";
import { MissedNoteField } from "@/components/MissedNoteField";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import type { RunnerContext } from "@/components/PracticeTestRunner";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { scoreColor } from "@/lib/score-scale";
import { formatDuration } from "@/lib/test-results-shared";
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

// A short line for the celebration moment.
function headlineFor(percent: number) {
  return percent >= 90 ? "Outstanding!" : percent >= 80 ? "Great work!" : percent >= 60 ? "Nice effort!" : "Keep practicing!";
}

// Celebrate only right after submitting, not when reopening an old result.
const FRESH_RESULT_MS = 60_000;

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

  // Best area: highest score among areas with at least 3 questions (any area if none).
  const bestArea = useMemo(() => {
    const pool = areaScores.filter((area) => area.total >= 3);
    return [...(pool.length ? pool : areaScores)].sort(
      (left, right) => right.correct / right.total - left.correct / left.total || right.total - left.total
    )[0];
  }, [areaScores]);

  const [celebrate] = useState(() =>
    percent >= 80 && attempt.submittedAt !== null && Date.now() - new Date(attempt.submittedAt).getTime() < FRESH_RESULT_MS ? 1 : 0
  );
  const reviewRef = useRef<HTMLElement>(null);
  const meta = [test.cluster, context.subtitle].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-[880px] space-y-14 pb-8">
      <Confetti burst={celebrate} />

      <HeroFadeIn>
        <section className="flex flex-col items-center text-center">
          <Illustration kind={percent >= 80 ? "trophy" : percent >= 60 ? "target" : "chart"} size={140} />
          <p className="mt-4 text-small font-bold text-fg-muted">{test.title}</p>
          <h1 className="mt-1 font-display text-[64px] font-extrabold leading-none tracking-[-0.03em] text-fg tabular-nums sm:text-[88px]">
            {percent}%
          </h1>
          <p className="mt-3 font-display text-h3 font-extrabold text-fg">
            {headlineFor(percent)} {correctCount} out of {total}
          </p>
          {meta ? <p className="mt-1 text-fg-muted">{meta}</p> : null}
          {attempt.timedOut ? (
            <Tag tone="wrong" className="mt-4">
              Time ran out. The test was submitted automatically.
            </Tag>
          ) : null}
          <SaveStatusLine status={saveStatus} />
        </section>
      </HeroFadeIn>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile
          boxed
          className="max-sm:p-4"
          value={<span className="max-sm:text-h2">{percent}%</span>}
          label={`${correctCount} of ${total} correct${unansweredCount > 0 ? ` · ${unansweredCount} unanswered` : ""}`}
        />
        <StatTile
          boxed
          className="max-sm:p-4"
          value={<span className="max-sm:text-h2">{attempt.elapsedSeconds ? formatDuration(Math.round(attempt.elapsedSeconds)) : "—"}</span>}
          label="Time"
        />
        <StatTile
          boxed
          className="col-span-2 max-sm:p-4 sm:col-span-1"
          value={<span className="block text-h3 leading-tight">{bestArea?.area ?? "—"}</span>}
          label={bestArea ? `Best area · ${percentOf(bestArea.correct, bestArea.total)}%` : "Best area"}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button size="lg" onClick={() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Review answers
        </Button>
        {missed.length > 0 ? (
          <Button size="lg" variant="secondary" onClick={practiceMissed}>
            Practice what I missed ({missed.length})
          </Button>
        ) : null}
        <div className="flex flex-wrap gap-1 sm:ml-auto">
          <Button variant="ghost" onClick={onRetake}>
            Retake test
          </Button>
          <ButtonLink variant="ghost" href={context.backHref}>
            Back to {context.backLabel.toLowerCase()}
          </ButtonLink>
        </div>
      </div>

      <section aria-labelledby="areas-title" className="space-y-5">
        <div>
          <h2 id="areas-title" className="font-display text-h2 font-extrabold text-fg">
            By instructional area
          </h2>
          <p className="mt-1 text-fg-muted">Weakest areas are listed first.</p>
        </div>
        <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
          {areaScores.map((area) => {
            const areaPercent = percentOf(area.correct, area.total);
            return (
              <li key={area.area} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[minmax(0,220px)_1fr_auto_auto]">
                <p className="font-bold text-fg">{area.area}</p>
                <p className="text-right text-small font-extrabold tabular-nums text-fg sm:order-3 sm:w-24">
                  {areaPercent}% <span className="font-bold text-fg-muted">· {area.correct}/{area.total}</span>
                </p>
                <div className="col-span-2 h-3 overflow-hidden rounded-full bg-track sm:order-2 sm:col-span-1" aria-hidden="true">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(areaPercent, 2)}%`, background: scoreColor(areaPercent) }} />
                </div>
                <Link
                  href={`/tests/custom?area=${encodeURIComponent(area.area)}`}
                  className="col-span-2 inline-flex items-center gap-1 text-small font-bold text-brand-text hover:underline sm:order-4 sm:col-span-1"
                  aria-label={`Practice ${area.area}`}
                >
                  Practice
                  <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section ref={reviewRef} aria-labelledby="review-title" className="scroll-mt-24 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="review-title" className="font-display text-h2 font-extrabold text-fg">
            Review answers
          </h2>
          <SegmentedControl
            label="Which questions to show"
            value={incorrectOnly ? "incorrect" : "all"}
            onChange={(value) => setIncorrectOnly(value === "incorrect")}
            items={[
              { value: "all", label: "All questions" },
              { value: "incorrect", label: `Incorrect only (${total - correctCount})` }
            ]}
          />
        </div>

        {reviewItems.length === 0 ? (
          <p className="flex items-center gap-2 rounded-card bg-correct-tint px-5 py-4 font-bold text-correct-text">
            <CheckCircleIcon size={22} weight="fill" aria-hidden="true" />
            No incorrect answers. Nice work!
          </p>
        ) : null}

        <div className="space-y-5">
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

function SaveStatusLine({ status }: { status: SaveStatus | "saving" }) {
  if (status === "saved") {
    return (
      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-small text-fg">
        <CheckCircleIcon size={18} weight="fill" aria-hidden="true" className="text-correct" />
        Saved to your dashboard. Add notes to missed questions below.
        <Link href="/account?tab=tests" className="font-bold text-brand-text hover:underline">
          View dashboard
        </Link>
      </p>
    );
  }

  if (status === "signed-out") {
    return (
      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-small text-fg">
        Sign in to save your results to your dashboard and add notes to missed questions.
        <Link href="/login" className="font-bold text-brand-text hover:underline">
          Sign in
        </Link>
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="mt-5 flex items-center justify-center gap-2 text-small text-fg">
        <WarningIcon size={18} weight="bold" aria-hidden="true" className="text-wrong-text" />
        Couldn&apos;t save this result to your account right now. It will be saved the next time you open your dashboard.
      </p>
    );
  }

  return null;
}

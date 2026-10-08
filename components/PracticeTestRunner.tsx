"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TestDialog } from "@/components/TestDialog";
import { TestProgressBar } from "@/components/TestProgressBar";
import { TestResults } from "@/components/TestResults";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { formatClock, formatTestMeta } from "@/lib/test-format";
import {
  createAttempt,
  fullTestStorageKey,
  loadAttempt,
  loadFeedbackPreference,
  removeStored,
  saveAttempt,
  saveFeedbackPreference,
  type AnswerFeedback,
  type TestAttempt
} from "@/lib/test-progress";
import type { PracticeTest, TestOptionKey } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];
const LOW_TIME_SECONDS = 5 * 60;

const primaryButton =
  "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";
const secondaryButton =
  "rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50";

// Where this run lives: full tests and the custom session use different storage
// keys, back links, and subtitles but share the same exam and results screens.
export type RunnerContext = {
  storageKey: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
};

export function PracticeTestRunner({ test, context }: { test: PracticeTest; context?: RunnerContext }) {
  const questionCount = test.questions.length;
  const ctx: RunnerContext = context ?? {
    storageKey: fullTestStorageKey(test.id),
    subtitle: formatTestMeta(test),
    backHref: "/tests",
    backLabel: "All practice tests"
  };
  const hasTimeLimit = Boolean(test.timeLimitMinutes && test.timeLimitMinutes > 0);

  // This component renders only in the browser (see PracticeTestLoader), so the
  // saved attempt can be read straight from localStorage on first render.
  // Finished attempts reopen on their results; unfinished ones offer resume.
  const [initial] = useState(() => loadAttempt(ctx.storageKey, test.id, questionCount));
  const [savedAttempt, setSavedAttempt] = useState<TestAttempt | null>(
    initial?.status === "in-progress" ? initial : null
  );
  const [attempt, setAttempt] = useState<TestAttempt | null>(initial?.status === "submitted" ? initial : null);
  const [timerChoice, setTimerChoice] = useState(true);
  const [feedbackChoice, setFeedbackChoice] = useState<AnswerFeedback>(loadFeedbackPreference);

  useEffect(() => {
    if (attempt) {
      saveAttempt(
        ctx.storageKey,
        attempt.status === "submitted" ? { ...attempt, score: scoreAttempt(test, attempt) } : attempt
      );
    }
  }, [attempt, ctx.storageKey, test]);

  const phase = !attempt ? "intro" : attempt.status === "submitted" ? "results" : "exam";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  const startNew = () => {
    removeStored(ctx.storageKey);
    setSavedAttempt(null);
    saveFeedbackPreference(feedbackChoice);
    setAttempt(createAttempt(test.id, questionCount, test.timeLimitMinutes, hasTimeLimit && timerChoice, feedbackChoice));
  };

  const resume = () => {
    if (savedAttempt) {
      setAttempt(savedAttempt);
      setSavedAttempt(null);
    }
  };

  const retake = () => {
    removeStored(ctx.storageKey);
    setSavedAttempt(null);
    setAttempt(null);
  };

  if (phase === "results" && attempt) {
    return <TestResults test={test} attempt={attempt} context={ctx} onRetake={retake} />;
  }

  if (phase === "exam" && attempt) {
    return <ExamView test={test} attempt={attempt} setAttempt={setAttempt} />;
  }

  return (
    <IntroView
      test={test}
      context={ctx}
      hasTimeLimit={hasTimeLimit}
      timerChoice={timerChoice}
      onTimerChoice={setTimerChoice}
      feedbackChoice={feedbackChoice}
      onFeedbackChoice={setFeedbackChoice}
      savedAttempt={savedAttempt}
      onStart={startNew}
      onResume={resume}
    />
  );
}

function scoreAttempt(test: PracticeTest, attempt: TestAttempt) {
  const correct = test.questions.filter((question) => attempt.answers[question.number] === question.answer).length;
  return { correct, total: test.questions.length };
}

/* ------------------------------------------------------------------ */
/* Intro: test details, answer feedback + timer, resume / start over  */
/* ------------------------------------------------------------------ */

function IntroView({
  test,
  context,
  hasTimeLimit,
  timerChoice,
  onTimerChoice,
  feedbackChoice,
  onFeedbackChoice,
  savedAttempt,
  onStart,
  onResume
}: {
  test: PracticeTest;
  context: RunnerContext;
  hasTimeLimit: boolean;
  timerChoice: boolean;
  onTimerChoice: (value: boolean) => void;
  feedbackChoice: AnswerFeedback;
  onFeedbackChoice: (value: AnswerFeedback) => void;
  savedAttempt: TestAttempt | null;
  onStart: () => void;
  onResume: () => void;
}) {
  const savedAnswered = savedAttempt ? Object.keys(savedAttempt.answers).length : 0;
  const instant = feedbackChoice === "instant";

  return (
    <HeroFadeIn>
      <section className="surface overflow-hidden">
        <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
          <Link href={context.backHref} className="text-sm font-semibold text-muted transition hover:text-ink">
            ← {context.backLabel}
          </Link>
          <p className="eyebrow mt-6">{test.cluster}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{test.title}</h1>
          {context.subtitle ? <p className="mt-2 text-base text-muted">{context.subtitle}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-[1.2rem] border border-line bg-white px-5 py-3 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Questions</p>
              <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-ink">{test.questions.length}</p>
            </div>
            {hasTimeLimit ? (
              <div className="rounded-[1.2rem] border border-line bg-white px-5 py-3 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Time limit</p>
                <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-ink">{test.timeLimitMinutes} min</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 p-7 sm:p-9">
          {savedAttempt ? (
            <div className="rounded-[1.6rem] border border-blue-100 bg-[linear-gradient(135deg,#f0f6ff,#f8fbff)] p-6">
              <p className="eyebrow">Test in progress</p>
              <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-ink">
                You&apos;ve answered {savedAnswered} of {savedAttempt.questionCount} questions.
              </p>
              <p className="mt-1 text-sm leading-7 text-muted">
                {savedAttempt.timerEnabled && savedAttempt.remainingSeconds !== null
                  ? `${formatClock(savedAttempt.remainingSeconds)} left on the timer. `
                  : ""}
                {savedAttempt.feedback === "instant" ? "Answers are checked as you go. " : ""}
                Pick up where you left off, or start over with a blank test.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={onResume} className={primaryButton}>
                  Resume test
                </button>
                <button type="button" onClick={onStart} className={secondaryButton}>
                  Start over
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="surface-soft p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Before you begin</p>
                <ul className="mt-3 space-y-2 text-base leading-7 text-ink">
                  {instant ? (
                    <li>Choose one answer (A–D) for each question. It&apos;s checked right away and locked in.</li>
                  ) : (
                    <li>Choose one answer (A–D) for each question. You can change answers any time before submitting.</li>
                  )}
                  <li>Flag questions you want to come back to, and use the question grid to jump around.</li>
                  <li>
                    {instant
                      ? "You'll see the correct answer and explanation after each question, plus a full breakdown when you submit."
                      : "Answers and explanations are revealed only after you submit."}
                  </li>
                  <li>Your progress saves automatically in this browser.</li>
                </ul>
              </div>

              <fieldset>
                <legend className="text-base font-semibold text-ink">When do you want to see answers?</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <FeedbackOption
                    checked={!instant}
                    onSelect={() => onFeedbackChoice("end")}
                    title="At the end"
                    description="Like the real exam. Answers stay hidden until you submit."
                  />
                  <FeedbackOption
                    checked={instant}
                    onSelect={() => onFeedbackChoice("instant")}
                    title="As I go"
                    description="See if you're right, plus the explanation, after each question."
                  />
                </div>
              </fieldset>

              {hasTimeLimit ? (
                <label className="flex cursor-pointer items-start gap-4 rounded-[1.4rem] border border-line bg-white p-5 transition hover:border-accent/40">
                  <input
                    type="checkbox"
                    checked={timerChoice}
                    onChange={(event) => onTimerChoice(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#2563eb]"
                  />
                  <span>
                    <span className="block text-base font-semibold text-ink">
                      Use the {test.timeLimitMinutes}-minute timer
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      The test submits automatically when time runs out. Turn this off to practice untimed.
                    </span>
                  </span>
                </label>
              ) : null}

              <button type="button" onClick={onStart} className={primaryButton}>
                Start test
              </button>
            </>
          )}
        </div>
      </section>
    </HeroFadeIn>
  );
}

function FeedbackOption({
  checked,
  onSelect,
  title,
  description
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[1.4rem] border p-5 transition ${
        checked ? "border-accent bg-accentSoft shadow-[0_0_0_1px_#2563eb]" : "border-line bg-white hover:border-accent/40"
      }`}
    >
      <input
        type="radio"
        name="answer-feedback"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-[#2563eb]"
      />
      <span>
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{description}</span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Exam                                                                */
/* ------------------------------------------------------------------ */

function ExamView({
  test,
  attempt,
  setAttempt
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  setAttempt: React.Dispatch<React.SetStateAction<TestAttempt | null>>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const questionCardRef = useRef<HTMLElement>(null);

  const total = test.questions.length;
  const index = Math.min(attempt.currentIndex, total - 1);
  const question = test.questions[index];
  const selected = attempt.answers[question.number];
  const isFlagged = attempt.flagged.includes(question.number);
  const answeredCount = Object.keys(attempt.answers).length;
  const unanswered = test.questions.filter((item) => !attempt.answers[item.number]).map((item) => item.number);
  const isLast = index === total - 1;
  // In "check as I go" mode an answered question is revealed and locked.
  const instant = attempt.feedback === "instant";
  const revealed = instant && Boolean(selected);
  const isCorrect = selected === question.answer;

  const update = useCallback(
    (patch: (current: TestAttempt) => Partial<TestAttempt>) => {
      setAttempt((current) => (current ? { ...current, ...patch(current) } : current));
    },
    [setAttempt]
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(total - 1, nextIndex));
      update(() => ({ currentIndex: clamped }));

      const card = questionCardRef.current;
      if (card && card.getBoundingClientRect().top < 0) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [total, update]
  );

  const choose = useCallback(
    (key: TestOptionKey) => {
      update((current) =>
        current.feedback === "instant" && current.answers[question.number]
          ? {}
          : { answers: { ...current.answers, [question.number]: key } }
      );
    },
    [question.number, update]
  );

  const clearChoice = () => {
    update((current) => {
      const answers = { ...current.answers };
      delete answers[question.number];
      return { answers };
    });
  };

  const toggleFlag = useCallback(() => {
    update((current) => ({
      flagged: current.flagged.includes(question.number)
        ? current.flagged.filter((number) => number !== question.number)
        : [...current.flagged, question.number]
    }));
  }, [question.number, update]);

  // Countdown. Time only runs while the test is open, so closing the tab pauses it.
  const timerActive = attempt.timerEnabled && attempt.remainingSeconds !== null;
  useEffect(() => {
    if (!timerActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setAttempt((current) => {
        if (!current || current.status !== "in-progress" || current.remainingSeconds === null) {
          return current;
        }

        const remainingSeconds = Math.max(0, current.remainingSeconds - 1);

        if (remainingSeconds === 0) {
          return { ...current, remainingSeconds, status: "submitted", submittedAt: new Date().toISOString(), timedOut: true };
        }

        return { ...current, remainingSeconds };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [setAttempt, timerActive]);

  // Keyboard shortcuts: A–D or 1–4 to answer, arrow keys to move, F to flag.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (confirmOpen || drawerOpen || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      const key = event.key.toUpperCase();
      const byNumber = ["1", "2", "3", "4"].indexOf(event.key);

      if ((OPTION_KEYS as string[]).includes(key)) {
        choose(key as TestOptionKey);
      } else if (byNumber !== -1) {
        choose(OPTION_KEYS[byNumber]);
      } else if (key === "F") {
        toggleFlag();
      } else if (event.key === "ArrowRight") {
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        goTo(index - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choose, confirmOpen, drawerOpen, goTo, index, toggleFlag]);

  const remaining = attempt.remainingSeconds ?? 0;
  const lowTime = timerActive && remaining <= LOW_TIME_SECONDS;

  const navigator = (
    <NavigatorPanel
      test={test}
      attempt={attempt}
      index={index}
      answeredCount={answeredCount}
      timer={timerActive ? { remaining, low: lowTime } : null}
      onJump={(itemIndex) => {
        setDrawerOpen(false);
        goTo(itemIndex);
      }}
      onSubmit={() => {
        setDrawerOpen(false);
        setConfirmOpen(true);
      }}
    />
  );

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px]">
      <section ref={questionCardRef} className="surface scroll-mt-24 overflow-hidden">
        <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] px-6 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-muted">{test.title}</p>
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {timerActive ? <TimerPill remaining={remaining} low={lowTime} /> : null}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-ink shadow-card"
              >
                Questions
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <TestProgressBar value={answeredCount} max={total} label="Questions answered" />
            <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
              {answeredCount} of {total} answered
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">
              Question {index + 1} of {total}
            </p>
            <button
              type="button"
              onClick={toggleFlag}
              aria-pressed={isFlagged}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                isFlagged
                  ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/60"
                  : "border-line bg-white text-muted hover:bg-[#f8fbff] hover:text-ink"
              }`}
            >
              <FlagIcon filled={isFlagged} />
              {isFlagged ? "Flagged" : (
                <>
                  <span className="sm:hidden">Flag</span>
                  <span className="hidden sm:inline">Flag for review</span>
                </>
              )}
            </button>
          </div>

          <h2 id="question-text" className="mt-3 whitespace-pre-line text-lg font-semibold leading-7 tracking-[-0.01em] text-ink sm:text-xl sm:leading-8">
            {question.question}
          </h2>

          <div role="radiogroup" aria-labelledby="question-text" className="mt-6 grid gap-2.5">
            {OPTION_KEYS.map((key) => {
              const isSelected = selected === key;
              const isAnswer = key === question.answer;
              const look = revealed
                ? isAnswer
                  ? { card: "border-green-200 bg-green-50", badge: "bg-green-500 text-white", tag: "text-green-700" }
                  : isSelected
                    ? { card: "border-red-200 bg-red-50", badge: "bg-red-400 text-white", tag: "text-red-700" }
                    : { card: "border-line bg-white opacity-70", badge: "border border-line bg-[#f5f7fb] text-muted", tag: "" }
                : isSelected
                  ? {
                      card: "border-accent bg-accentSoft shadow-[0_0_0_1px_#2563eb]",
                      badge: "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white",
                      tag: "text-accent"
                    }
                  : {
                      card: "border-line bg-white hover:border-accent/40 hover:bg-[#f8fbff]",
                      badge: "border border-line bg-[#f5f7fb] text-muted",
                      tag: ""
                    };
              const tag = revealed
                ? isAnswer && isSelected
                  ? "Your answer ✓"
                  : isAnswer
                    ? "Correct answer"
                    : isSelected
                      ? "Your answer"
                      : null
                : isSelected
                  ? "Selected"
                  : null;

              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={revealed || undefined}
                  onClick={() => choose(key)}
                  className={`flex items-start gap-3.5 rounded-[1.1rem] border px-4 py-3 text-left transition ${look.card} ${
                    revealed ? "cursor-default" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${look.badge}`}
                  >
                    {key}
                  </span>
                  <span className={`flex-1 pt-0.5 text-[0.95rem] leading-6 ${isSelected ? "font-semibold text-ink" : "text-ink"}`}>
                    {question.options[key]}
                  </span>
                  {tag ? (
                    <span className={`shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${look.tag}`}>
                      {tag}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {revealed ? (
            <div
              role="status"
              className={`mt-4 rounded-[1.2rem] border p-5 ${
                isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              <p className={`text-sm font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "Correct!" : `Not quite. The correct answer is ${question.answer}.`}
              </p>
              <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-7 text-ink">{question.explanation}</p>
            </div>
          ) : null}

          <div className="mt-2 flex min-h-6 items-center justify-between gap-3">
            {selected && !revealed ? (
              <button
                type="button"
                onClick={clearChoice}
                className="text-sm font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline"
              >
                Clear selection
              </button>
            ) : (
              <span />
            )}
            <p className="hidden text-xs text-muted lg:block">
              Keys: <Kbd>A</Kbd>–<Kbd>D</Kbd> or <Kbd>1</Kbd>–<Kbd>4</Kbd> {instant ? "answer" : "select"} · <Kbd>←</Kbd> <Kbd>→</Kbd> move ·{" "}
              <Kbd>F</Kbd> flag
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/80 pt-5">
            <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} className={secondaryButton}>
              ← Previous
            </button>
            {isLast ? (
              <button type="button" onClick={() => setConfirmOpen(true)} className={primaryButton}>
                Review and submit
              </button>
            ) : (
              <button type="button" onClick={() => goTo(index + 1)} className={primaryButton}>
                Next →
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="surface hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-5 md:sticky md:top-24 md:block">{navigator}</aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/40 backdrop-blur-sm md:hidden" onClick={() => setDrawerOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Questions"
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm font-semibold text-muted">
                Close
              </button>
            </div>
            {navigator}
          </div>
        </div>
      ) : null}

      {confirmOpen ? (
        <SubmitDialog
          unanswered={unanswered}
          flaggedCount={attempt.flagged.length}
          onCancel={() => setConfirmOpen(false)}
          onJump={(number) => {
            setConfirmOpen(false);
            goTo(test.questions.findIndex((item) => item.number === number));
          }}
          onConfirm={() => {
            setConfirmOpen(false);
            update(() => ({ status: "submitted", submittedAt: new Date().toISOString(), timedOut: false }));
          }}
        />
      ) : null}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-white px-1 py-px font-sans text-[0.7rem] font-semibold text-ink">{children}</kbd>
  );
}

function TimerPill({ remaining, low }: { remaining: number; low: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
        low ? "border-amber-200 bg-amber-50 text-amber-800" : "border-line bg-white text-muted"
      }`}
    >
      <span className="sr-only">Time left: </span>
      <span className="font-bold tabular-nums text-ink">{formatClock(remaining)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Question navigator: timer, compact grid, legend, submit             */
/* ------------------------------------------------------------------ */

function NavigatorPanel({
  test,
  attempt,
  index,
  answeredCount,
  timer,
  onJump,
  onSubmit
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  index: number;
  answeredCount: number;
  timer: { remaining: number; low: boolean } | null;
  onJump: (index: number) => void;
  onSubmit: () => void;
}) {
  const instant = attempt.feedback === "instant";
  const isRight = (number: number, answer: TestOptionKey) => attempt.answers[number] === answer;
  const correctCount = test.questions.filter((item) => isRight(item.number, item.answer)).length;

  return (
    <div>
      {timer ? (
        <div
          className={`mb-4 flex items-center justify-between rounded-[1.1rem] border px-4 py-3 ${
            timer.low ? "border-amber-200 bg-amber-50" : "border-line bg-[#f8fbff]"
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${timer.low ? "text-amber-800" : "text-muted"}`}>
            Time left
          </p>
          <p className="text-2xl font-bold tracking-[-0.03em] text-ink tabular-nums">{formatClock(timer.remaining)}</p>
        </div>
      ) : null}

      {instant ? (
        <div className="mb-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-[1.1rem] border border-green-200 bg-green-50 px-3 py-2.5">
            <p className="text-xl font-bold tracking-[-0.03em] text-green-700 tabular-nums">{correctCount}</p>
            <p className="text-xs font-semibold text-green-700">correct</p>
          </div>
          <div className="rounded-[1.1rem] border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-xl font-bold tracking-[-0.03em] text-red-700 tabular-nums">{answeredCount - correctCount}</p>
            <p className="text-xs font-semibold text-red-700">incorrect</p>
          </div>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Questions</p>
        <p className="text-xs font-semibold text-ink tabular-nums">
          {answeredCount}/{test.questions.length} answered
        </p>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1">
        {test.questions.map((item, itemIndex) => {
          const answered = Boolean(attempt.answers[item.number]);
          const flagged = attempt.flagged.includes(item.number);
          const current = itemIndex === index;
          // Checked-as-you-go answers show right/wrong; flags then show as a dot.
          const result = instant && answered ? (isRight(item.number, item.answer) ? "correct" : "incorrect") : null;
          const state = [result ?? (answered ? "answered" : "unanswered"), flagged ? "flagged" : null]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={item.number}
              type="button"
              onClick={() => onJump(itemIndex)}
              aria-label={`Question ${itemIndex + 1}, ${state}`}
              aria-current={current ? "step" : undefined}
              className={`relative flex aspect-square items-center justify-center rounded-md border text-[0.65rem] font-semibold tabular-nums transition ${
                result === "correct"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : result === "incorrect"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : flagged
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : answered
                        ? "border-accent/30 bg-accentSoft text-accent"
                        : "border-line bg-white text-muted hover:border-accent/40 hover:text-ink"
              } ${current ? "z-10 ring-2 ring-accent ring-offset-1" : ""}`}
            >
              {itemIndex + 1}
              {flagged && answered ? (
                <span
                  className={`absolute bottom-0.5 right-0.5 h-1 w-1 rounded-full ${result ? "bg-amber-500" : "bg-accent"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-line bg-white ring-2 ring-accent ring-offset-1" /> Current
        </span>
        {instant ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-green-200 bg-green-50" /> Correct
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-red-200 bg-red-50" /> Incorrect
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-accent/30 bg-accentSoft" /> Answered
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-line bg-white" /> Unanswered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> Flagged
        </span>
      </div>

      <div className="mt-5 border-t border-line/80 pt-4">
        <button type="button" onClick={onSubmit} className={`${primaryButton} w-full`}>
          Submit test
        </button>
        <p className="mt-2 text-center text-xs text-muted">Progress saves automatically.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Submit confirmation                                                 */
/* ------------------------------------------------------------------ */

function SubmitDialog({
  unanswered,
  flaggedCount,
  onCancel,
  onJump,
  onConfirm
}: {
  unanswered: number[];
  flaggedCount: number;
  onCancel: () => void;
  onJump: (number: number) => void;
  onConfirm: () => void;
}) {
  const hasUnanswered = unanswered.length > 0;

  return (
    <TestDialog
      warning={hasUnanswered}
      eyebrow={hasUnanswered ? "Unanswered questions" : "Ready to submit"}
      title={
        hasUnanswered
          ? `You have ${unanswered.length} unanswered ${unanswered.length === 1 ? "question" : "questions"}.`
          : "Submit your test?"
      }
      cancelLabel="Keep working"
      confirmLabel={hasUnanswered ? "Submit anyway" : "Submit test"}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="mt-3 text-sm leading-7 text-muted">
        {hasUnanswered
          ? "Unanswered questions are marked incorrect. "
          : "You won't be able to change your answers after submitting. "}
        {flaggedCount > 0
          ? `${flaggedCount} ${flaggedCount === 1 ? "question is" : "questions are"} still flagged for review.`
          : ""}
      </p>

      {hasUnanswered ? (
        <div className="mt-4 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {unanswered.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onJump(number)}
              className="h-9 min-w-9 rounded-xl border border-line bg-white px-2 text-sm font-semibold text-muted transition hover:bg-[#f8fbff] hover:text-ink"
            >
              {number}
            </button>
          ))}
        </div>
      ) : null}
    </TestDialog>
  );
}

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M4.5 17.5V3.5M4.5 3.5h9l-1.75 3.5 1.75 3.5h-9" strokeLinejoin="round" />
    </svg>
  );
}

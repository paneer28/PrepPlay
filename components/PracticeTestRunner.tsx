"use client";

import { ArrowLeftIcon, ClockIcon, FlagIcon, ListNumbersIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button } from "@/components/ds/Button";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { Checkbox } from "@/components/ds/Field";
import { NavCell } from "@/components/ds/NavCell";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { SidePanel } from "@/components/ds/SidePanel";
import { StatTile } from "@/components/ds/StatTile";
import { Tag } from "@/components/ds/Tag";
import { TestDialog } from "@/components/TestDialog";
import { TestResults } from "@/components/TestResults";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
import { questionSetOf, type QuestionSet } from "@/lib/question-sets";
import type { UploadSource } from "@/lib/test-sync";
import type { PracticeTest, TestOptionKey } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];
const LOW_TIME_SECONDS = 5 * 60;


// Where this run lives: full tests and the custom session use different storage
// keys, back links, and subtitles but share the same exam and results screens.
export type RunnerContext = {
  storageKey: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  // What the result is saved as on the account.
  upload: UploadSource;
  // Which question set this run comes from: decides where "Practice this area"
  // and "Practice what I missed" go. Defaults to the test's own set.
  set?: QuestionSet;
};

export function PracticeTestRunner({ test, context }: { test: PracticeTest; context?: RunnerContext }) {
  const questionCount = test.questions.length;
  const ctx: RunnerContext = context ?? {
    storageKey: fullTestStorageKey(test.id),
    subtitle: formatTestMeta(test),
    backHref: "/tests",
    backLabel: "All practice tests",
    upload: { mode: "full", testId: test.id },
    set: questionSetOf(test)
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

  const patchAttempt = useCallback((patch: Partial<TestAttempt>) => {
    setAttempt((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const retake = () => {
    removeStored(ctx.storageKey);
    setSavedAttempt(null);
    setAttempt(null);
  };

  if (phase === "results" && attempt) {
    return <TestResults test={test} attempt={attempt} context={ctx} onRetake={retake} onAttemptChange={patchAttempt} />;
  }

  if (phase === "exam" && attempt) {
    return <ExamView test={test} attempt={attempt} setAttempt={setAttempt} backHref={ctx.backHref} />;
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
      <div className="mx-auto max-w-[720px] space-y-10 pb-8">
        <div className="space-y-5">
          <Link
            href={context.backHref}
            className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline"
          >
            <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
            {context.backLabel}
          </Link>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Tag tone="brand">{test.cluster}</Tag>
              {test.year ? <Tag>{test.year}</Tag> : null}
              {test.event ? <Tag>{test.event}</Tag> : null}
            </div>
            <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">{test.title}</h1>
            {/* Year and level are already tags; custom sessions describe their mix here. */}
            {context.subtitle && context.subtitle !== formatTestMeta(test) ? <p className="text-fg-muted">{context.subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <StatTile value={test.questions.length} label="Questions" />
            {hasTimeLimit ? <StatTile value={`${test.timeLimitMinutes} min`} label="Time limit" /> : null}
          </div>
        </div>

        {savedAttempt ? (
          <section className="card space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-h3 font-extrabold text-fg">Test in progress</h2>
              <p className="font-bold text-fg">
                You&apos;ve answered {savedAnswered} of {savedAttempt.questionCount} questions.
              </p>
            </div>
            <ProgressBar value={savedAnswered / savedAttempt.questionCount} label="Questions answered" />
            <p className="text-fg">
              {savedAttempt.timerEnabled && savedAttempt.remainingSeconds !== null
                ? `${formatClock(savedAttempt.remainingSeconds)} left on the timer. `
                : ""}
              {savedAttempt.feedback === "instant" ? "Answers are checked as you go. " : ""}
              Pick up where you left off, or start over with a blank test.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Button size="lg" onClick={onResume}>
                Resume test
              </Button>
              <Button size="lg" variant="secondary" onClick={onStart}>
                Start over
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-h4 font-bold text-fg">Before you begin</h2>
              <ul className="list-disc space-y-2 pl-5 text-fg marker:text-fg-muted">
                {instant ? (
                  <li>Choose one answer (A–D) for each question, then press Check. It&apos;s checked right away and locked in.</li>
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
            </section>

            <fieldset className="space-y-3">
              <legend className="mb-3 font-display text-h4 font-bold text-fg">When do you want to see answers?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceTile
                  checked={!instant}
                  onSelect={() => onFeedbackChoice("end")}
                  title="At the end"
                  description="Like the real exam. Answers stay hidden until you submit."
                />
                <ChoiceTile
                  checked={instant}
                  onSelect={() => onFeedbackChoice("instant")}
                  title="As I go"
                  description="See if you're right, plus the explanation, after each question."
                />
              </div>
            </fieldset>

            {hasTimeLimit ? (
              <Checkbox
                checked={timerChoice}
                onChange={(event) => onTimerChoice(event.target.checked)}
                className="items-start [&>input]:mt-0.5"
                label={
                  <span>
                    <span className="block text-body font-bold text-fg">Use the {test.timeLimitMinutes}-minute timer</span>
                    <span className="mt-0.5 block text-small font-medium text-fg-muted">
                      The test submits automatically when time runs out. Turn this off to practice untimed.
                    </span>
                  </span>
                }
              />
            ) : null}

            <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
              Start test
            </Button>
          </>
        )}
      </div>
    </HeroFadeIn>
  );
}

// A radio choice drawn as an answer-option tile.
function ChoiceTile({
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
    <label className="option cursor-pointer items-start" data-state={checked ? "selected" : "idle"}>
      <input type="radio" name="answer-feedback" checked={checked} onChange={onSelect} className="sr-only" />
      <span className="option-badge mt-0.5 rounded-full" aria-hidden="true">
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
      </span>
      <span>
        <span className="block font-extrabold text-fg">{title}</span>
        <span className="mt-0.5 block text-small font-medium text-fg-muted">{description}</span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Exam: a focused, game-like question screen                          */
/* ------------------------------------------------------------------ */

function ExamView({
  test,
  attempt,
  setAttempt,
  backHref
}: {
  test: PracticeTest;
  attempt: TestAttempt;
  setAttempt: React.Dispatch<React.SetStateAction<TestAttempt | null>>;
  backHref: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  // "Check as I go": the picked option waits for Check before it's locked in.
  const [pending, setPending] = useState<{ number: number; key: TestOptionKey } | null>(null);

  const total = test.questions.length;
  const index = Math.min(attempt.currentIndex, total - 1);
  const question = test.questions[index];
  const selected = attempt.answers[question.number];
  const isFlagged = attempt.flagged.includes(question.number);
  const answeredCount = Object.keys(attempt.answers).length;
  const unanswered = test.questions.filter((item) => !attempt.answers[item.number]).map((item) => item.number);
  const isLast = index === total - 1;
  const instant = attempt.feedback === "instant";
  const revealed = instant && Boolean(selected);
  const isCorrect = selected === question.answer;
  const pendingKey = pending?.number === question.number ? pending.key : null;

  // Hide the site header and footer while the test is on screen.
  useLayoutEffect(() => {
    document.documentElement.dataset.focusMode = "test";
    return () => {
      delete document.documentElement.dataset.focusMode;
    };
  }, []);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [total, update]
  );

  const commit = useCallback(
    (key: TestOptionKey) => {
      update((current) =>
        current.feedback === "instant" && current.answers[question.number]
          ? {}
          : { answers: { ...current.answers, [question.number]: key } }
      );
    },
    [question.number, update]
  );

  const choose = useCallback(
    (key: TestOptionKey) => {
      if (!instant) {
        commit(key);
      } else if (!revealed) {
        setPending({ number: question.number, key });
      }
    },
    [commit, instant, question.number, revealed]
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

  // The one main action for the current state: Check, Continue, Next, or submit.
  const primary = useCallback(() => {
    if (instant && !revealed) {
      if (pendingKey) commit(pendingKey);
      return;
    }
    if (isLast) setConfirmOpen(true);
    else if (instant || selected) goTo(index + 1);
  }, [commit, goTo, index, instant, isLast, pendingKey, revealed, selected]);

  // Time taken: counts only while the exam is on screen, flushed into the saved
  // attempt every 15 seconds, when the tab is hidden, and on submit.
  const visibleSince = useRef<number | null>(null);
  const takeElapsed = useCallback(() => {
    if (visibleSince.current === null) return 0;
    const now = Date.now();
    const seconds = (now - visibleSince.current) / 1000;
    visibleSince.current = now;
    return seconds;
  }, []);

  useEffect(() => {
    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;

    const flush = () => {
      const seconds = takeElapsed();
      if (seconds > 0) {
        update((current) => ({ elapsedSeconds: (current.elapsedSeconds ?? 0) + seconds }));
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        visibleSince.current = null;
      } else {
        visibleSince.current = Date.now();
      }
    };

    const interval = window.setInterval(flush, 15000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [takeElapsed, update]);

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

  // Keyboard shortcuts: A–D or 1–4 to answer, Enter for the main button,
  // arrow keys to move, F to flag.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (confirmOpen || exitOpen || drawerOpen || event.metaKey || event.ctrlKey || event.altKey) {
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
      } else if (event.key === "Enter" && !(target && ["BUTTON", "A"].includes(target.tagName))) {
        event.preventDefault();
        primary();
      } else if (event.key === "ArrowRight") {
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        goTo(index - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choose, confirmOpen, drawerOpen, exitOpen, goTo, index, primary, toggleFlag]);

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

  const optionState = (key: TestOptionKey): AnswerState => {
    if (revealed) return key === question.answer ? "correct" : key === selected ? "wrong" : "dimmed";
    return key === (instant ? pendingKey : selected) ? "selected" : "idle";
  };

  const primaryLabel = instant && !revealed ? "Check" : isLast ? "Review and submit" : instant ? "Continue" : "Next";
  const primaryDisabled = instant && !revealed ? !pendingKey : !isLast && !selected;

  return (
    <div className={revealed ? "pb-[70vh]" : "pb-48"}>
      {/* Top bar: exit, progress, count, timer, question grid */}
      <div className="fixed inset-x-0 top-0 z-30 border-b-[1.5px] border-rule bg-page">
        <div className="mx-auto flex h-16 max-w-[960px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            aria-label="Exit test"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <XIcon size={22} weight="bold" aria-hidden="true" />
          </button>
          <ProgressBar value={answeredCount / total} label={`${answeredCount} of ${total} questions answered`} className="min-w-0 flex-1" />
          <p className="shrink-0 text-small font-extrabold tabular-nums text-fg">
            <span className="sr-only">Question </span>
            {index + 1}
            <span className="text-fg-muted">/{total}</span>
          </p>
          {timerActive ? <TimerPill remaining={remaining} low={lowTime} /> : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            aria-label="Questions"
            icon={<ListNumbersIcon size={18} weight="bold" aria-hidden="true" />}
            className="shrink-0 max-sm:px-2.5"
          >
            <span className="hidden sm:inline">Questions</span>
          </Button>
        </div>
      </div>

      {/* The question */}
      <section aria-labelledby="question-text" className="mx-auto max-w-[720px] pt-16">
        <div className="flex items-center justify-between gap-4">
          <p className="text-label font-bold text-fg-muted">
            Question {index + 1} of {total}
          </p>
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={isFlagged}
            className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-3 text-small font-bold transition-colors ${
              isFlagged ? "bg-streak-tint text-streak-text" : "text-fg-muted hover:bg-surface hover:text-fg"
            }`}
          >
            <FlagIcon size={16} weight={isFlagged ? "fill" : "bold"} aria-hidden="true" className={isFlagged ? "text-streak" : ""} />
            {isFlagged ? "Flagged" : "Flag"}
          </button>
        </div>

        <h1 id="question-text" className="mt-3 whitespace-pre-line font-body text-[22px] font-bold leading-snug text-fg sm:text-[24px]">
          {question.question}
        </h1>

        <div role="radiogroup" aria-labelledby="question-text" className="mt-7 grid gap-3">
          {OPTION_KEYS.map((key, keyIndex) => {
            const state = optionState(key);
            return (
              <AnswerOption
                key={key}
                letter={key}
                shortcut={String(keyIndex + 1)}
                state={state}
                role="radio"
                aria-checked={state === "selected" || (revealed && key === selected)}
                aria-disabled={revealed || undefined}
                onClick={() => choose(key)}
              >
                {question.options[key]}
              </AnswerOption>
            );
          })}
        </div>

        <div className="mt-4 flex min-h-9 items-center justify-between gap-3">
          {selected && !instant ? (
            <Button variant="ghost" size="sm" onClick={clearChoice}>
              Clear selection
            </Button>
          ) : (
            <span />
          )}
          <p className="hidden text-label font-semibold text-fg-muted lg:block">
            <Kbd>A</Kbd>–<Kbd>D</Kbd> or <Kbd>1</Kbd>–<Kbd>4</Kbd> {instant ? "pick" : "select"} · <Kbd>Enter</Kbd>{" "}
            {instant ? "check" : "next"} · <Kbd>←</Kbd> <Kbd>→</Kbd> move · <Kbd>F</Kbd> flag
          </p>
        </div>
      </section>

      {/* Bottom bar, or the feedback banner once an answer is checked */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        {revealed ? (
          <FeedbackBanner
            key={question.number}
            bar
            tone={isCorrect ? "correct" : "wrong"}
            correctAnswer={`${question.answer}. ${question.options[question.answer]}`}
            explanation={question.explanation}
            continueLabel={isLast ? "Review and submit" : "Continue"}
            onContinue={primary}
          />
        ) : (
          <div className="border-t-[1.5px] border-rule bg-page px-4 py-4">
            <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  aria-label="Previous question"
                  className="px-3"
                >
                  <ArrowLeftIcon size={20} weight="bold" aria-hidden="true" />
                </Button>
                {!isLast && !selected && !pendingKey ? (
                  <Button variant="ghost" onClick={() => goTo(index + 1)}>
                    Skip
                  </Button>
                ) : null}
              </div>
              <Button size="lg" onClick={primary} disabled={primaryDisabled} className="min-w-[140px] sm:min-w-[180px]">
                {primaryLabel}
              </Button>
            </div>
          </div>
        )}
      </div>

      <SidePanel open={drawerOpen} onClose={closeDrawer} title="Questions">
        {navigator}
      </SidePanel>
      <BottomSheet open={drawerOpen} onClose={closeDrawer} label="Questions" title="Questions">
        {navigator}
      </BottomSheet>

      {exitOpen ? (
        <TestDialog
          eyebrow="Your progress is saved"
          title="Leave this test?"
          cancelLabel="Keep going"
          confirmLabel="Leave test"
          onCancel={() => setExitOpen(false)}
          onConfirm={() => {
            const seconds = takeElapsed();
            update((current) => ({ elapsedSeconds: (current.elapsedSeconds ?? 0) + seconds }));
            router.push(backHref);
          }}
        >
          <p className="mt-3 text-fg">Your answers are saved in this browser, so you can pick up where you left off.</p>
        </TestDialog>
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
            const seconds = takeElapsed();
            update((current) => ({
              status: "submitted",
              submittedAt: new Date().toISOString(),
              timedOut: false,
              elapsedSeconds: (current.elapsedSeconds ?? 0) + seconds
            }));
          }}
        />
      ) : null}
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border-[1.5px] border-b-[3px] border-rule bg-page px-1.5 py-px font-body text-label font-bold text-fg">
      {children}
    </kbd>
  );
}

function TimerPill({ remaining, low }: { remaining: number; low: boolean }) {
  return (
    <p
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-small font-extrabold tabular-nums ${
        low ? "bg-wrong-tint text-wrong-text" : "bg-surface text-fg"
      }`}
    >
      <ClockIcon size={16} weight="bold" aria-hidden="true" />
      <span className="sr-only">Time left: </span>
      {formatClock(remaining)}
    </p>
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
    <div className="space-y-6">
      {timer || instant ? (
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {timer ? (
            <div>
              <p className={`font-display text-h2 font-extrabold tabular-nums ${timer.low ? "text-wrong-text" : "text-fg"}`}>
                {formatClock(timer.remaining)}
              </p>
              <p className="text-small font-bold text-fg-muted">Time left</p>
            </div>
          ) : null}
          {instant ? (
            <>
              <div>
                <p className="font-display text-h2 font-extrabold tabular-nums text-correct-text">{correctCount}</p>
                <p className="text-small font-bold text-fg-muted">Correct</p>
              </div>
              <div>
                <p className="font-display text-h2 font-extrabold tabular-nums text-wrong-text">{answeredCount - correctCount}</p>
                <p className="text-small font-bold text-fg-muted">Incorrect</p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-small font-bold text-fg">
          <span className="tabular-nums">{answeredCount}</span> of <span className="tabular-nums">{test.questions.length}</span> answered
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
          {test.questions.map((item, itemIndex) => {
            const answered = Boolean(attempt.answers[item.number]);
            return (
              <NavCell
                key={item.number}
                number={itemIndex + 1}
                answered={answered}
                flagged={attempt.flagged.includes(item.number)}
                current={itemIndex === index}
                result={instant && answered ? (isRight(item.number, item.answer) ? "correct" : "wrong") : null}
                onClick={() => onJump(itemIndex)}
                className="w-full"
              />
            );
          })}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-label font-bold text-fg-muted">
        <LegendItem swatch="outline outline-[2.5px] outline-offset-1 outline-fg border-[1.5px] border-rule bg-page">Current</LegendItem>
        {instant ? (
          <>
            <LegendItem swatch="bg-correct-fill">Correct</LegendItem>
            <LegendItem swatch="bg-wrong-fill">Incorrect</LegendItem>
          </>
        ) : (
          <LegendItem swatch="bg-brand">Answered</LegendItem>
        )}
        <LegendItem swatch="border-[1.5px] border-rule bg-page">Not answered</LegendItem>
        <LegendItem swatch="bg-streak">Flagged</LegendItem>
      </ul>

      <div className="space-y-2 border-t-[1.5px] border-rule pt-5">
        <Button block size="lg" onClick={onSubmit}>
          Submit test
        </Button>
        <p className="text-center text-label font-semibold text-fg-muted">Progress saves automatically.</p>
      </div>
    </div>
  );
}

function LegendItem({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-3.5 w-3.5 rounded ${swatch}`} />
      {children}
    </li>
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
      <p className="mt-3 text-fg">
        {hasUnanswered
          ? "Unanswered questions are marked incorrect. "
          : "You won't be able to change your answers after submitting. "}
        {flaggedCount > 0
          ? `${flaggedCount} ${flaggedCount === 1 ? "question is" : "questions are"} still flagged for review.`
          : ""}
      </p>

      {hasUnanswered ? (
        <div className="mt-4 flex max-h-32 flex-wrap gap-2 overflow-y-auto p-0.5">
          {unanswered.map((number) => (
            <NavCell key={number} number={number} answered={false} flagged={false} current={false} onClick={() => onJump(number)} />
          ))}
        </div>
      ) : null}
    </TestDialog>
  );
}

"use client";

import { ArrowClockwiseIcon, CaretDownIcon, CheckIcon, LightningIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Confetti } from "@/components/ds/Confetti";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { Tag } from "@/components/ds/Tag";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { PromptDialog } from "@/components/shell/WelcomePrompt";
import { TestDialog } from "@/components/TestDialog";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import { drawShareQuiz } from "@/app/q/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { TestOptionKey, TestQuestion } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];

// One visitor's run, kept in sessionStorage so a refresh, a locked phone or a
// trip to sign up and back doesn't lose it (or redraw the questions).
type Run = {
  questions: TestQuestion[];
  answers: Record<number, TestOptionKey>;
  index: number;
  status: "intro" | "playing" | "done";
  recorded?: boolean;
};

const storageKey = (quizId: string) => `prepplay:share-quiz:${quizId}`;

function loadRun(quizId: string): Run | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(quizId));
    const run = raw ? (JSON.parse(raw) as Run) : null;
    return run && Array.isArray(run.questions) && run.questions.length > 0 ? run : null;
  } catch {
    return null;
  }
}

function saveRun(quizId: string, run: Run | null) {
  try {
    if (run) window.sessionStorage.setItem(storageKey(quizId), JSON.stringify(run));
    else window.sessionStorage.removeItem(storageKey(quizId));
  } catch {
    // Private browsing can block storage; the quiz still works without it.
  }
}

// "2025 State" / "PrepPlay original"
function originLabel(question: TestQuestion) {
  const origin = question.origin;
  if (!origin) return null;
  if (origin.original) return "PrepPlay original";
  return [origin.year, origin.event].filter(Boolean).join(" ") || null;
}

function headlineFor(percent: number) {
  return percent === 100 ? "Perfect score!" : percent >= 80 ? "Great work!" : percent >= 60 ? "Nice effort!" : "Good start!";
}

export function ShareQuiz({
  quizId,
  title,
  questions: drawn,
  bankSize,
  signedIn
}: {
  quizId: string;
  title: string;
  questions: TestQuestion[];
  // Real DECA exam questions on the site, for the sign-up pitch.
  bankSize: number;
  signedIn: boolean;
}) {
  // Rendered client-only (see ShareQuizLoader), so storage can be read here.
  const [run, setRun] = useState<Run>(
    () => loadRun(quizId) ?? { questions: drawn, answers: {}, index: 0, status: "intro" }
  );

  useEffect(() => {
    saveRun(quizId, run);
  }, [quizId, run]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [run.status]);

  const start = () => setRun((current) => ({ ...current, status: "playing", index: 0, answers: {} }));

  // A new random draw from the server, straight into the first question.
  const [drawing, setDrawing] = useState(false);
  const playAgain = async () => {
    setDrawing(true);
    const questions = await drawShareQuiz(quizId).catch(() => null);
    setDrawing(false);
    setRun((current) => ({ questions: questions?.length ? questions : current.questions, answers: {}, index: 0, status: "playing" }));
    setJustFinished(false);
  };

  // Celebrate only right after finishing, not when a finished run is reopened.
  const [justFinished, setJustFinished] = useState(false);

  // Last question answered: show the score and count the run on the dev page.
  const finish = () => {
    const correct = run.questions.filter((question) => run.answers[question.number] === question.answer).length;
    setJustFinished(true);
    setRun((current) => ({ ...current, status: "done", recorded: true }));
    if (!run.recorded && isSupabaseConfigured()) {
      createClient()
        .rpc("record_share_quiz_play", { p_id: quizId, p_correct: correct, p_total: run.questions.length })
        .then(() => undefined, () => undefined);
    }
  };

  if (run.status === "playing") {
    return <QuestionScreen run={run} setRun={setRun} onFinish={finish} />;
  }

  if (run.status === "done") {
    return <ResultsScreen run={run} bankSize={bankSize} signedIn={signedIn} celebrate={justFinished} drawing={drawing} onPlayAgain={playAgain} />;
  }

  return <IntroScreen title={title} onStart={start} />;
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */

function IntroScreen({ title, onStart }: { title: string; onStart: () => void }) {
  return (
    <HeroFadeIn>
      <div className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center gap-8 py-2">
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-brand text-white shadow-[0_6px_0_var(--brand-edge)] sm:h-20 sm:w-20">
            <LightningIcon size={36} weight="fill" aria-hidden="true" />
          </span>
          <h1 className="font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-fg [overflow-wrap:anywhere] sm:text-h1">
            {title}
          </h1>
        </div>

        <Button size="lg" block onClick={onStart}>
          Start quiz
        </Button>
      </div>
    </HeroFadeIn>
  );
}

/* ------------------------------------------------------------------ */
/* Questions: pick, Check, see the answer, Continue                    */
/* ------------------------------------------------------------------ */

function QuestionScreen({
  run,
  setRun,
  onFinish
}: {
  run: Run;
  setRun: React.Dispatch<React.SetStateAction<Run>>;
  onFinish: () => void;
}) {
  const [pending, setPending] = useState<TestOptionKey | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const banner = useRef<HTMLDivElement>(null);

  const total = run.questions.length;
  const index = Math.min(run.index, total - 1);
  const question = run.questions[index];
  const chosen = run.answers[question.number] ?? null;
  const revealed = Boolean(chosen);
  const isLast = index === total - 1;
  const answeredCount = Object.keys(run.answers).length;
  const correctSoFar = run.questions.filter((item) => run.answers[item.number] === item.answer).length;
  const source = originLabel(question);
  const area = question.performanceIndicator.instructionalArea?.trim();

  // Hide the site header and footer while answering.
  useLayoutEffect(() => {
    document.documentElement.dataset.focusMode = "quiz";
    return () => {
      delete document.documentElement.dataset.focusMode;
    };
  }, []);

  const check = useCallback(() => {
    if (!pending || revealed) return;
    setRun((current) => ({ ...current, answers: { ...current.answers, [question.number]: pending } }));
  }, [pending, question.number, revealed, setRun]);

  const next = useCallback(() => {
    setPending(null);
    if (isLast) onFinish();
    else setRun((current) => ({ ...current, index: index + 1 }));
    window.scrollTo({ top: 0 });
  }, [index, isLast, onFinish, setRun]);

  // Keyboard, for presenting from a laptop: A–D or 1–4, Enter.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (exitOpen || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      const byNumber = ["1", "2", "3", "4"].indexOf(event.key);
      if (!revealed && (OPTION_KEYS as string[]).includes(key)) setPending(key as TestOptionKey);
      else if (!revealed && byNumber !== -1) setPending(OPTION_KEYS[byNumber]);
      else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (revealed) next();
        else check();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [check, exitOpen, next, revealed]);

  // Room under the options for whichever bottom bar is showing, so the last
  // option and the explanation never hide behind it.
  const [bannerHeight, setBannerHeight] = useState(0);
  useLayoutEffect(() => {
    const element = banner.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setBannerHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  const optionState = (key: TestOptionKey): AnswerState => {
    if (revealed) return key === question.answer ? "correct" : key === chosen ? "wrong" : "dimmed";
    return key === pending ? "selected" : "idle";
  };

  return (
    <div style={{ paddingBottom: bannerHeight + 24 }}>
      {/* Top bar: exit, progress, score */}
      <div className="fixed inset-x-0 top-0 z-30 border-b-[1.5px] border-rule bg-page">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-3 px-3 sm:h-16 sm:px-6">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            aria-label="Quit quiz"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <XIcon size={22} weight="bold" aria-hidden="true" />
          </button>
          <ProgressBar value={answeredCount / total} label={`${answeredCount} of ${total} answered`} className="min-w-0 flex-1" />
          <p className="shrink-0 pr-1 text-small font-extrabold tabular-nums text-fg">
            <span className="sr-only">Question </span>
            {index + 1}
            <span className="text-fg-muted">/{total}</span>
          </p>
        </div>
      </div>

      <section aria-labelledby="quiz-question" className="mx-auto max-w-[720px] pt-12 sm:pt-16">
        <div className="flex flex-wrap items-center gap-2">
          {source ? <Tag tone="brand">{source}</Tag> : null}
          {area ? <Tag className="max-w-full truncate">{area}</Tag> : null}
          {correctSoFar > 0 ? (
            <span className="ml-auto inline-flex items-center gap-1 text-label font-extrabold text-correct-text">
              <CheckIcon size={14} weight="bold" aria-hidden="true" />
              {correctSoFar} correct
            </span>
          ) : null}
        </div>

        <h1
          id="quiz-question"
          className="mt-4 whitespace-pre-line font-body text-[19px] font-bold leading-snug text-fg [overflow-wrap:anywhere] min-[400px]:text-[20px] sm:text-[24px]"
        >
          {question.question}
        </h1>

        <div role="radiogroup" aria-labelledby="quiz-question" className="mt-6 grid gap-3 [overflow-wrap:anywhere]">
          {OPTION_KEYS.map((key, keyIndex) => {
            const state = optionState(key);
            return (
              <AnswerOption
                key={key}
                letter={key}
                shortcut={String(keyIndex + 1)}
                state={state}
                role="radio"
                aria-checked={state === "selected" || (revealed && key === chosen)}
                aria-disabled={revealed || undefined}
                onClick={() => !revealed && setPending(key)}
              >
                {question.options[key]}
              </AnswerOption>
            );
          })}
        </div>
      </section>

      <div ref={banner} className="fixed inset-x-0 bottom-0 z-30">
        {revealed ? (
          <FeedbackBanner
            key={question.number}
            bar
            tone={chosen === question.answer ? "correct" : "wrong"}
            correctAnswer={`${question.answer}. ${question.options[question.answer]}`}
            explanation={question.explanation}
            continueLabel={isLast ? "See my score" : "Continue"}
            onContinue={next}
          />
        ) : (
          <div className="border-t-[1.5px] border-rule bg-page px-4 py-3 sm:py-4">
            <div className="mx-auto max-w-[720px]">
              <Button size="lg" block onClick={check} disabled={!pending} className="sm:ml-auto sm:w-auto sm:min-w-[200px]">
                Check
              </Button>
            </div>
          </div>
        )}
      </div>

      {exitOpen ? (
        <TestDialog
          eyebrow={`${answeredCount} of ${total} answered`}
          title="Quit this quiz?"
          cancelLabel="Keep going"
          confirmLabel="Quit"
          onCancel={() => setExitOpen(false)}
          onConfirm={() => setRun((current) => ({ ...current, status: "intro", index: 0, answers: {} }))}
        >
          <p className="mt-3 text-fg">Your answers so far will be cleared, and you can start again from the beginning.</p>
        </TestDialog>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results: score, sign-up pitch, answer review                         */
/* ------------------------------------------------------------------ */

function ResultsScreen({
  run,
  bankSize,
  signedIn,
  celebrate,
  drawing,
  onPlayAgain
}: {
  run: Run;
  bankSize: number;
  signedIn: boolean;
  celebrate: boolean;
  drawing: boolean;
  onPlayAgain: () => void;
}) {
  const total = run.questions.length;
  const correct = run.questions.filter((question) => run.answers[question.number] === question.answer).length;
  const percent = Math.round((correct / total) * 100);
  const [burst] = useState(() => (celebrate && percent >= 70 ? 1 : 0));
  const [reviewOpen, setReviewOpen] = useState(false);
  // Right after finishing, signed-out visitors get a sign-up prompt once the
  // score has had a moment on screen.
  const [promptOpen, setPromptOpen] = useState(false);
  useEffect(() => {
    if (!celebrate || signedIn) return;
    const timer = window.setTimeout(() => setPromptOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, [celebrate, signedIn]);
  const bank = bankSize >= 1000 ? `${(Math.floor(bankSize / 500) * 500).toLocaleString()}+` : `${bankSize}`;

  return (
    <HeroFadeIn>
      <Confetti burst={burst} />
      {promptOpen ? (
        <PromptDialog title={`You got ${correct} of ${total}! Make a free account?`} onClose={() => setPromptOpen(false)}>
          <p className="mt-2 text-fg">
            Practice with {bank} real DECA exam questions, save your scores and see what to study next. It takes a minute.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/login?from=quiz&next=/exams" className="btn btn-lg flex-1">
              Create account
            </Link>
            <Link href="/login?mode=login&from=quiz&next=/exams" className="btn btn-lg btn-secondary flex-1">
              Log in
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setPromptOpen(false)}
            className="mt-3 min-h-11 w-full rounded-control text-small font-bold text-fg-muted hover:text-fg"
          >
            Not now
          </button>
        </PromptDialog>
      ) : null}
      <div className="mx-auto max-w-md space-y-8 pb-4 sm:max-w-xl">
        {/* Score */}
        <section className="space-y-5 pt-2 text-center" aria-labelledby="quiz-score">
          <ScoreRing correct={correct} total={total} />
          <div className="space-y-1.5">
            <h1 id="quiz-score" className="font-display text-[32px] font-extrabold leading-tight text-fg sm:text-h1">
              {headlineFor(percent)}
            </h1>
            <p className="text-body font-bold text-fg-muted">
              You got <span className="text-fg">{correct} of {total}</span> right on real DECA exam questions.
            </p>
          </div>
        </section>

        {/* Sign up */}
        {signedIn ? (
          <section className="space-y-4 rounded-[24px] bg-brand p-6 text-white shadow-[0_6px_0_var(--brand-edge)]">
            <h2 className="font-display text-h3 font-extrabold">Keep the streak going</h2>
            <p className="font-semibold text-white/90">Full practice exams, custom question sets and roleplays are waiting on your account.</p>
            <ButtonLink href="/exams" size="lg" block variant="secondary">
              Go to practice exams
            </ButtonLink>
          </section>
        ) : (
          <section aria-labelledby="quiz-signup" className="space-y-5 rounded-[24px] bg-brand p-6 text-white shadow-[0_6px_0_var(--brand-edge)] sm:p-7">
            <div className="space-y-2">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-label font-extrabold">Free account</span>
              <h2 id="quiz-signup" className="font-display text-[26px] font-extrabold leading-tight sm:text-h2">
                Want to beat that score?
              </h2>
              <p className="font-semibold text-white/90">
                Make a free PrepPlay account to practice with {bank} real DECA exam questions and track your progress.
              </p>
            </div>
            <ul className="space-y-2.5">
              {["Full past DECA exams, timed or untimed", "Practice only the questions you missed", "Roleplay practice with judge feedback"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-3 font-bold">
                    <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20">
                      <CheckIcon size={14} weight="bold" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                )
              )}
            </ul>
            <div className="space-y-3 pt-1">
              <ButtonLink href="/login?from=quiz&next=/exams" size="lg" block variant="secondary">
                Create free account
              </ButtonLink>
              <p className="text-center text-small font-semibold text-white/90">
                Already have one?{" "}
                <Link href="/login?mode=login&from=quiz&next=/exams" className="font-extrabold text-white underline underline-offset-2">
                  Log in
                </Link>
              </p>
            </div>
          </section>
        )}

        <Button
          variant="secondary"
          size="lg"
          block
          onClick={onPlayAgain}
          disabled={drawing}
          icon={<ArrowClockwiseIcon size={20} weight="bold" aria-hidden="true" />}
        >
          {drawing ? "Picking questions..." : `Try ${total} new questions`}
        </Button>

        {/* Review */}
        <section className="space-y-4">
          <button
            type="button"
            aria-expanded={reviewOpen}
            onClick={() => setReviewOpen((open) => !open)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control bg-surface px-4 text-left font-extrabold text-fg"
          >
            Review your answers
            <CaretDownIcon size={18} weight="bold" aria-hidden="true" className={`transition-transform ${reviewOpen ? "rotate-180" : ""}`} />
          </button>
          {reviewOpen ? (
            <div className="space-y-4">
              {run.questions.map((question, index) => (
                <QuestionReviewCard
                  key={question.number}
                  label={`Question ${index + 1}`}
                  question={question}
                  chosen={run.answers[question.number] ?? null}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </HeroFadeIn>
  );
}

function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const size = 148;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = total > 0 ? correct / total : 0;

  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value)}
          className={`${value >= 0.7 ? "stroke-correct" : "stroke-brand"} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <p className="absolute font-display text-[40px] font-extrabold tabular-nums text-fg">
        {correct}
        <span className="text-[24px] text-fg-muted">/{total}</span>
      </p>
    </div>
  );
}

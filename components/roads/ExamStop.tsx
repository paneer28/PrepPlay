"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Confetti } from "@/components/ds/Confetti";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { Illustration } from "@/components/ds/Illustration";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { Flashcard, type CardFace } from "@/components/roads/Flashcard";
import { markRoadItems, PASS_PERCENT, recordLocalAnswers } from "@/lib/road-shared";
import { questionRef } from "@/lib/test-format";
import { newId } from "@/lib/test-progress";
import { uploadAttempts } from "@/lib/test-sync";
import type { TestOptionKey, TestQuestion } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];

// An exam road stop: the PI's flashcard, then its questions, checked as you go.
// A checkpoint has no card. A flashcard-only stop has no questions yet.
export function ExamStop({
  title,
  summary,
  card,
  questions,
  item,
  practice = false
}: {
  title: string;
  // How it's named on the dashboard.
  summary: string;
  card: CardFace | null;
  questions: TestQuestion[];
  // Saved when it's finished, for stops not judged from question scores alone.
  item: string | null;
  // A weak-spot set: extra practice rather than a stop to pass.
  practice?: boolean;
}) {
  const [phase, setPhase] = useState<"card" | "questions" | "done">(card ? "card" : "questions");
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<TestOptionKey | null>(null);
  const [answers, setAnswers] = useState<TestOptionKey[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [burst, setBurst] = useState(0);
  const startedAt = useRef(new Date().toISOString());
  const startedMs = useRef(0);

  const refOf = useCallback((question: TestQuestion) => questionRef(question.origin!.testId, question.origin!.number), []);
  const question = questions[index];
  const correctCount = answers.filter((answer, position) => answer === questions[position].answer).length;
  const percent = questions.length ? Math.round((correctCount / questions.length) * 100) : 100;
  const passed = percent >= PASS_PERCENT;

  const beginQuestions = () => {
    startedAt.current = new Date().toISOString();
    startedMs.current = Date.now();
    setPhase("questions");
  };

  const pick = useCallback(
    (key: TestOptionKey) => {
      if (phase !== "questions" || picked) return;
      setPicked(key);
    },
    [phase, picked]
  );

  const finish = async (final: TestOptionKey[]) => {
    const score = final.filter((answer, position) => answer === questions[position].answer).length;
    const pass = Math.round((score / questions.length) * 100) >= PASS_PERCENT;
    setPhase("done");
    if (pass) setBurst((value) => value + 1);

    recordLocalAnswers(
      questions.map((entry, position) => ({
        ref: refOf(entry),
        pi: entry.performanceIndicator.code,
        correct: final[position] === entry.answer
      }))
    );
    if (pass && item) void markRoadItems([item]);

    const { status } = await uploadAttempts([
      {
        id: newId(),
        mode: "custom",
        refs: questions.map(refOf),
        filters: { summary },
        answers: Object.fromEntries(final.map((answer, position) => [String(position + 1), answer])),
        startedAt: startedAt.current,
        submittedAt: new Date().toISOString(),
        elapsedSeconds: startedMs.current ? (Date.now() - startedMs.current) / 1000 : null,
        timedOut: false
      }
    ]);
    // Signed out, the result stays in this browser, which isn't a failure.
    setSaveFailed(status === "error" || status === "unavailable");
  };

  const next = () => {
    if (!picked) return;
    const final = [...answers, picked];
    setAnswers(final);
    setPicked(null);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
    } else {
      void finish(final);
    }
  };

  const retry = () => {
    setAnswers([]);
    setIndex(0);
    setPicked(null);
    setSaveFailed(false);
    beginQuestions();
  };

  // 1-4 or A-D pick an answer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "questions" || picked || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      const position = OPTION_KEYS.indexOf(key as TestOptionKey);
      const choice = position >= 0 ? OPTION_KEYS[position] : OPTION_KEYS[Number(key) - 1];
      if (choice) pick(choice);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, pick, picked]);

  const back = (
    <Link href="/learn" className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline">
      <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
      Exam road
    </Link>
  );

  if (phase === "card" && card) {
    return (
      <div data-road="exam" className="mx-auto max-w-[720px] space-y-6 pb-10">
        {back}
        <Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((value) => !value)} />
        {questions.length > 0 ? (
          <Button size="lg" block onClick={beginQuestions}>
            Start {questions.length} {questions.length === 1 ? "question" : "questions"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-small font-semibold text-fg-muted">This indicator is flashcard-only for now. Questions are on the way.</p>
            <ButtonLink
              href="/learn"
              size="lg"
              block
              onClick={() => {
                if (item) void markRoadItems([item]);
              }}
            >
              Got it
            </ButtonLink>
          </div>
        )}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div data-road="exam" className="mx-auto max-w-[720px] space-y-6 pb-10">
        <Confetti burst={burst} />
        {back}
        <div className="flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center">
          <Illustration kind={passed ? "trophy" : "target"} size={120} />
          <h1 className="mt-4 font-display text-h2 font-extrabold text-fg">{practice ? `${title} practice done` : passed ? "Stop finished" : "Almost there"}</h1>
          <p className={`mt-1 font-display text-h1 font-extrabold tabular-nums ${passed ? "text-correct-text" : "text-fg"}`}>{percent}%</p>
          <p className="mt-1 text-fg">
            {correctCount} of {questions.length} correct.{passed || practice ? "" : ` ${PASS_PERCENT}% finishes this stop.`}
          </p>
          {saveFailed ? (
            <p role="status" className="mt-3 text-small font-bold text-wrong-text">
              This result couldn&apos;t be saved to your account.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant={passed ? "secondary" : "primary"} size="lg" onClick={retry}>
              {passed ? "Practice again" : "Try again"}
            </Button>
            <ButtonLink href="/learn" size="lg" variant={passed ? "primary" : "secondary"}>
              Back to the road
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const stateOf = (key: TestOptionKey): AnswerState => {
    if (!picked) return "idle";
    if (key === question.answer) return "correct";
    return key === picked ? "wrong" : "dimmed";
  };

  return (
    <div data-road="exam" className="mx-auto max-w-[720px] space-y-6 pb-10">
      {back}
      <div className="flex items-center gap-3">
        <ProgressBar value={(index + (picked ? 1 : 0)) / questions.length} label={`${title} progress`} />
        <span className="shrink-0 text-small font-extrabold tabular-nums text-fg-muted">
          {index + 1} of {questions.length}
        </span>
      </div>
      <h1 className="whitespace-pre-line font-display text-h4 font-extrabold text-fg sm:text-h3">{question.question}</h1>
      <div className="space-y-3">
        {OPTION_KEYS.map((key, position) => (
          <AnswerOption key={key} letter={key} shortcut={String(position + 1)} state={stateOf(key)} disabled={Boolean(picked)} onClick={() => pick(key)}>
            {question.options[key]}
          </AnswerOption>
        ))}
      </div>
      {picked ? (
        <FeedbackBanner
          tone={picked === question.answer ? "correct" : "wrong"}
          correctAnswer={`${question.answer}. ${question.options[question.answer]}`}
          explanation={question.explanation}
          continueLabel={index + 1 < questions.length ? "Next question" : "See results"}
          onContinue={next}
        />
      ) : null}
    </div>
  );
}

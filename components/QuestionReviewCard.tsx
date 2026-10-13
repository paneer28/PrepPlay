import type { ReactNode } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { AreaTag, Tag } from "@/components/ds/Tag";
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

  const stateFor = (key: TestOptionKey): AnswerState =>
    key === question.answer ? "correct" : key === chosen ? "wrong" : "dimmed";
  const noteFor = (key: TestOptionKey) =>
    key === question.answer ? (key === chosen ? "Your answer" : "Correct answer") : key === chosen ? "Your answer" : undefined;

  return (
    <article id={id} className="card scroll-mt-28 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-bold text-fg-muted">{label}</p>
        <Tag tone={isCorrect ? "correct" : "wrong"}>{isCorrect ? "Correct" : chosen ? "Incorrect" : "Unanswered"}</Tag>
      </div>

      {question.origin ? (
        <p className="-mt-3 text-small text-fg-muted">
          From <span className="font-bold text-fg">{question.origin.title}</span>
          {formatTestMeta(question.origin) ? ` · ${formatTestMeta(question.origin)}` : ""} · original question{" "}
          {question.origin.number}
        </p>
      ) : null}

      <h3 className="whitespace-pre-line font-body text-h4 font-bold leading-snug text-fg">{question.question}</h3>

      <div className="grid gap-3">
        {OPTION_KEYS.map((key) => (
          <AnswerOption key={key} letter={key} state={stateFor(key)} note={noteFor(key)} readOnly>
            {question.options[key]}
          </AnswerOption>
        ))}
      </div>

      <FeedbackBanner
        tone={isCorrect ? "correct" : "wrong"}
        correctAnswer={`${question.answer}. ${question.options[question.answer]}`}
        explanation={question.explanation}
        animated={false}
      />

      <div className="space-y-2 text-small">
        {question.source ? (
          <p className="text-fg-muted [overflow-wrap:anywhere]">
            <span className="font-bold text-fg">Source:</span> {question.source}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="brand">{pi.code}</Tag>
          {pi.text ? <span className="font-semibold text-fg">{pi.text}</span> : null}
          {pi.instructionalArea ? <AreaTag area={pi.instructionalArea} /> : null}
          {pi.level ? <Tag>{pi.level}</Tag> : null}
        </div>
      </div>

      {children}
    </article>
  );
}

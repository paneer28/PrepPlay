"use client";

import { CaretDownIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button } from "@/components/ds/Button";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { AreaTag, Tag } from "@/components/ds/Tag";
import { useNoteEditor } from "@/components/review/NoteEditor";
import { Collapse } from "@/components/ui/Collapse";
import { formatTestMeta } from "@/lib/test-format";
import { NOTE_MAX_LENGTH } from "@/lib/test-results-shared";
import { saveQuestionNote } from "@/lib/test-sync";
import type { TestOptionKey, TestQuestion } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];
// Notes are written beside the card, so only where there's room for both.
const DESKTOP_QUERY = "(min-width: 1024px)";

// One question on a review page. The explanation starts hidden. On a computer
// the "Take a note" tab on the card's right edge opens a note panel beside it
// and blurs the question, so the note is written from memory; on smaller
// screens a saved note is shown read-only.
//
// `graded`: false for a question with no answer to mark (a flagged question
// that wasn't missed): only the correct answer is shown.
export function ReviewCard({
  id,
  label,
  question,
  chosen,
  graded = true,
  tags,
  note,
  children
}: {
  id: string;
  label: string;
  question: TestQuestion;
  chosen: TestOptionKey | null;
  graded?: boolean;
  tags?: ReactNode;
  // Null hides notes entirely (signed out, or a result that isn't saved).
  note: { ref: string; initial: string | null } | null;
  children?: ReactNode;
}) {
  const editor = useNoteEditor();
  const [showExplanation, setShowExplanation] = useState(false);
  const explanationId = useId();
  const isCorrect = chosen === question.answer;
  const pi = question.performanceIndicator;

  const savedNote = note ? (note.ref in editor.saved ? editor.saved[note.ref] : note.initial) : null;
  const editing = Boolean(note) && editor.openId === id;

  // Back on the tab after saving or cancelling, without scrolling.
  const tabRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (!editing && wasEditing.current) tabRef.current?.focus({ preventScroll: true });
    wasEditing.current = editing;
  }, [editing]);

  const stateFor = (key: TestOptionKey): AnswerState =>
    key === question.answer ? "correct" : graded && key === chosen ? "wrong" : "dimmed";
  const noteFor = (key: TestOptionKey) =>
    key === question.answer
      ? graded && key === chosen
        ? "Your answer"
        : "Correct answer"
      : graded && key === chosen
        ? "Your answer"
        : undefined;

  return (
    <div className="relative lg:flex">
      <article
        id={id}
        className={`card relative min-w-0 flex-1 scroll-mt-28 ${editing ? "lg:rounded-r-none" : ""}`}
        aria-label={label}
      >
        <div
          inert={editing}
          aria-hidden={editing || undefined}
          className={`space-y-5 transition-[filter] duration-200 ${editing ? "pointer-events-none select-none blur-[7px]" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-label font-bold text-fg-muted">{label}</p>
            <div className="flex flex-wrap items-center gap-2">
              {tags}
              {graded ? <Tag tone={isCorrect ? "correct" : "wrong"}>{isCorrect ? "Correct" : chosen ? "Incorrect" : "Unanswered"}</Tag> : null}
            </div>
          </div>

          {question.origin ? (
            <p className="-mt-3 text-small text-fg-muted">
              From <span className="font-bold text-fg">{question.origin.title}</span>
              {formatTestMeta(question.origin) ? ` · ${formatTestMeta(question.origin)}` : ""} · original question {question.origin.number}
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

          {savedNote ? (
            <div className="rounded-control bg-surface px-4 py-3 lg:hidden">
              <p className="text-label font-extrabold text-fg">Your note</p>
              <p className="mt-1 whitespace-pre-line text-small text-fg [overflow-wrap:anywhere]">{savedNote}</p>
              <p className="mt-2 text-label font-semibold text-fg-muted">Notes can be written and edited on a computer.</p>
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={() => setShowExplanation((open) => !open)}
              aria-expanded={showExplanation}
              aria-controls={explanationId}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline"
            >
              {showExplanation ? "Hide explanation" : "Show explanation"}
              <CaretDownIcon
                size={14}
                weight="bold"
                aria-hidden="true"
                className={`transition-transform duration-200 ${showExplanation ? "rotate-180" : ""}`}
              />
            </button>
            <Collapse open={showExplanation} id={explanationId} lazy>
              <div className="space-y-4 pt-3">
                {graded ? (
                  <FeedbackBanner
                    tone={isCorrect ? "correct" : "wrong"}
                    correctAnswer={`${question.answer}. ${question.options[question.answer]}`}
                    explanation={question.explanation}
                    animated={false}
                  />
                ) : (
                  <div className="space-y-1.5 rounded-card border-[1.5px] border-rule bg-surface p-5 sm:p-6">
                    <p className="font-bold text-correct-text [overflow-wrap:anywhere]">
                      Correct answer: {question.answer}. {question.options[question.answer]}
                    </p>
                    {question.explanation ? (
                      <p className="whitespace-pre-line text-small text-fg [overflow-wrap:anywhere]">{question.explanation}</p>
                    ) : null}
                  </div>
                )}

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
              </div>
            </Collapse>
          </div>

          {children}
        </div>

        {editing ? (
          <div className="pointer-events-none absolute inset-0 z-10 hidden justify-center lg:flex">
            <p className="sticky top-[40vh] mt-16 h-fit rounded-full border-[1.5px] border-rule bg-raised px-4 py-2 text-small font-bold text-fg shadow-[0_2px_0_var(--rule)]">
              Hidden while you write your note
            </p>
          </div>
        ) : null}
      </article>

      {note ? (
        editing ? (
          <NotePanel cardId={id} noteRef={note.ref} initial={savedNote ?? ""} />
        ) : (
          <NoteTab ref={tabRef} hasNote={Boolean(savedNote)} onOpen={() => editor.request(id)} />
        )
      ) : null}
    </div>
  );
}

// Tab geometry, in px. The tab overlaps the card's 1.5px border so the two
// outlines join, with concave fillets where it meets the card's edge.
const TAB_W = 40;
const TAB_BODY = 156;
const FILLET = 8;
const CORNER = 10;
const TAB_H = TAB_BODY + FILLET * 2;
const EDGE = 0.75; // centre of the card's border line
const RIGHT = TAB_W - 0.75;

const outline = [
  `M ${EDGE} 0`,
  `A ${FILLET} ${FILLET} 0 0 0 ${EDGE + FILLET} ${FILLET}`,
  `H ${RIGHT - CORNER}`,
  `A ${CORNER} ${CORNER} 0 0 1 ${RIGHT} ${FILLET + CORNER}`,
  `V ${TAB_H - FILLET - CORNER}`,
  `A ${CORNER} ${CORNER} 0 0 1 ${RIGHT - CORNER} ${TAB_H - FILLET}`,
  `H ${EDGE + FILLET}`,
  `A ${FILLET} ${FILLET} 0 0 0 ${EDGE} ${TAB_H}`
].join(" ");

function NoteTab({ ref, hasNote, onOpen }: { ref: Ref<HTMLButtonElement>; hasNote: boolean; onOpen: () => void }) {
  return (
    <div className="relative -ml-[1.5px] hidden w-10 shrink-0 lg:block">
      <div className="group sticky top-24 mt-5" style={{ width: TAB_W, height: TAB_H }}>
        <svg width={TAB_W} height={TAB_H} viewBox={`0 0 ${TAB_W} ${TAB_H}`} aria-hidden="true" className="absolute inset-0 overflow-visible">
          {/* Fill reaches under the card's border so no line shows where they join. */}
          <path d={`${outline} L 0 ${TAB_H} L 0 0 Z`} className="fill-page transition-colors group-hover:fill-surface" />
          <path d={outline} fill="none" strokeWidth="1.5" className="stroke-rule transition-colors group-hover:stroke-rule-strong" />
        </svg>
        <button
          ref={ref}
          type="button"
          onClick={onOpen}
          className="absolute flex flex-col items-center justify-center gap-2 rounded-r-[10px] text-label font-extrabold text-fg-muted transition-colors group-hover:text-fg focus-visible:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          style={{ left: 1.5, top: FILLET, width: TAB_W - 2.25, height: TAB_BODY }}
        >
          <PencilSimpleIcon size={16} weight="bold" aria-hidden="true" className="shrink-0" />
          <span className="[writing-mode:vertical-rl]">{hasNote ? "Edit your note" : "Take a note"}</span>
          {hasNote ? <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-correct-fill" /> : null}
          {hasNote ? <span className="sr-only">(a note is saved)</span> : null}
        </button>
      </div>
    </div>
  );
}

function NotePanel({ cardId, noteRef, initial }: { cardId: string; noteRef: string; initial: string }) {
  const editor = useNoteEditor();
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const dirty = draft.trim() !== initial.trim();
  const { setDirty, close } = editor;

  useEffect(() => {
    // Focus without scrolling, so the page stays where the user is.
    fieldRef.current?.focus({ preventScroll: true });
    const end = fieldRef.current?.value.length ?? 0;
    fieldRef.current?.setSelectionRange(end, end);
  }, []);

  useEffect(() => {
    setDirty(cardId, dirty);
  }, [cardId, dirty, setDirty]);

  // Esc cancels, wherever focus is (e.g. on another card's tab).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  // Too narrow for the panel (window resized): put the question back.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (!query.matches) close();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [close]);

  const save = async () => {
    setStatus("saving");
    const text = draft.trim();
    if (await saveQuestionNote(noteRef, text)) {
      editor.markSaved(noteRef, text || null);
      close();
    } else {
      setStatus("error");
    }
  };

  return (
    <aside
      aria-label="Your note"
      className="-ml-[1.5px] hidden w-[320px] shrink-0 rounded-r-card border-[1.5px] border-rule bg-page lg:block"
    >
      <div className="sticky top-24 space-y-3 p-5">
        <label htmlFor={fieldId} className="block font-display text-h4 font-extrabold text-fg">
          {initial ? "Edit your note" : "Take a note"}
        </label>
        <p className="text-small text-fg-muted">Write it from memory: what&apos;s the idea, and what tripped you up?</p>
        <textarea
          ref={fieldRef}
          id={fieldId}
          rows={7}
          maxLength={NOTE_MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="field min-h-40 resize-y py-2.5 leading-6"
        />

        {editor.pendingId ? (
          <div role="alert" className="space-y-2 rounded-control bg-wrong-tint px-3.5 py-3">
            <p className="text-small font-bold text-wrong-text">This note has unsaved text. Discard it and open the other note?</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="danger" onClick={editor.discardAndOpenPending}>
                Discard
              </Button>
              <Button size="sm" variant="secondary" onClick={editor.keepWriting}>
                Keep writing
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save and show the question"}
          </Button>
          <Button variant="secondary" onClick={close} disabled={status === "saving"}>
            Cancel
          </Button>
        </div>
        {status === "error" ? (
          <p role="alert" className="text-small font-bold text-wrong-text">
            Couldn&apos;t save your note. Try again.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

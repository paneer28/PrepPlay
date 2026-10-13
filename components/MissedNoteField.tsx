"use client";

import { useEffect, useRef, useState } from "react";
import { NOTE_MAX_LENGTH, NOTE_TAGS } from "@/lib/test-results-shared";
import { saveNote } from "@/lib/test-sync";

const SAVE_DELAY_MS = 700;

// Replaces any quick-pick tag at the start of the note, keeping the user's own words.
function applyTag(note: string, tag: string) {
  const rest = NOTE_TAGS.reduce((text, existing) => (text.startsWith(existing) ? text.slice(existing.length) : text), note)
    .replace(/^\s*[—–:-]?\s*/, "")
    .trim();
  return rest ? `${tag} — ${rest}` : tag;
}

// "Add a note" on a missed question: quick-pick tags plus free text, saved to
// the account automatically shortly after the user stops typing.
export function MissedNoteField({
  attemptId,
  position,
  initialNote,
  onSaved
}: {
  attemptId: string;
  position: number;
  initialNote: string;
  onSaved?: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSaved = useRef(initialNote);
  const fieldId = `note-${attemptId}-${position}`;

  useEffect(() => {
    if (note.trim() === lastSaved.current.trim()) return;

    const timer = window.setTimeout(async () => {
      setStatus("saving");
      const ok = await saveNote(attemptId, position, note.trim());
      if (ok) {
        lastSaved.current = note;
        onSaved?.(note.trim());
      }
      setStatus(ok ? "saved" : "error");
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [attemptId, note, onSaved, position]);

  return (
    <div className="space-y-2.5 border-t-[1.5px] border-rule pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-small font-extrabold text-fg">
          {initialNote ? "Your note" : "Add a note"}
        </label>
        <span className={`text-label font-bold ${status === "error" ? "text-wrong-text" : "text-fg-muted"}`} aria-live="polite">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save. Keep typing to retry." : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {NOTE_TAGS.map((tag) => {
          const active = note.startsWith(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => setNote((current) => applyTag(current, tag))}
              data-tone={active ? "brand" : "neutral"}
              className={`tag min-h-8 cursor-pointer border-[1.5px] px-3 transition-colors ${
                active ? "border-brand" : "border-transparent hover:border-rule-strong hover:text-fg"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <textarea
        id={fieldId}
        rows={2}
        maxLength={NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What tripped you up?"
        className="field min-h-20 resize-y py-2.5 leading-6"
      />
    </div>
  );
}

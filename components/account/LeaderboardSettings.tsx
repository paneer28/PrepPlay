"use client";

import { useState, useTransition } from "react";
import { saveLeaderboardProfile } from "@/app/account/leaderboard-actions";
import { Button } from "@/components/ds/Button";
import { Checkbox, FieldLabel, TextInput } from "@/components/ds/Field";
import { normalizeDisplayName, validDisplayName, type SaveLeaderboardResult } from "@/lib/leaderboard-shared";

const MESSAGES: Record<Exclude<SaveLeaderboardResult, "saved">, string> = {
  taken: "That name is taken. Try another.",
  invalid: "Use 3 to 20 letters, numbers, spaces, dots, dashes or underscores.",
  "missing-name": "Pick a display name first.",
  unavailable: "The leaderboard isn't set up on this site yet.",
  error: "Something went wrong. Try again in a moment."
};

// Display name and the opt-in switch. Nobody appears on the board until they save
// a name with "Show me on the leaderboard" ticked.
export function LeaderboardSettings({ displayName, optedIn }: { displayName: string | null; optedIn: boolean }) {
  const [editing, setEditing] = useState(!optedIn);
  const [name, setName] = useState(displayName ?? "");
  // The form is for joining (or renaming while joined), so the box starts ticked.
  const [show, setShow] = useState(true);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (nextName: string, nextShow: boolean) => {
    setMessage(null);
    if (nextShow && !normalizeDisplayName(nextName)) return setMessage({ tone: "error", text: MESSAGES["missing-name"] });
    if (normalizeDisplayName(nextName) && !validDisplayName(nextName)) return setMessage({ tone: "error", text: MESSAGES.invalid });
    startTransition(async () => {
      const result = await saveLeaderboardProfile(nextName, nextShow);
      if (result === "saved") {
        setEditing(!nextShow);
        setShow(true);
        setMessage({ tone: "ok", text: nextShow ? "Saved. You're on the board." : "Saved. You're hidden from the board." });
      } else {
        setMessage({ tone: "error", text: MESSAGES[result] });
      }
    });
  };

  const status = message ? (
    <p role="status" className={`text-small font-bold ${message.tone === "error" ? "text-wrong-text" : "text-correct-text"}`}>
      {message.text}
    </p>
  ) : null;

  if (!editing && optedIn && displayName) {
    return (
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-small font-bold text-fg-muted">You appear as</p>
          <p className="font-display text-h3 font-extrabold text-fg">{displayName}</p>
          {status}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setMessage(null); setEditing(true); }}>
            Change name
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => save(displayName, false)}>
            Hide me
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        save(name, show);
      }}
    >
      <div>
        <h3 className="font-display text-h3 font-extrabold text-fg">{optedIn ? "Change your display name" : "Join the leaderboard"}</h3>
        <p className="mt-1 max-w-xl text-small text-fg-muted">
          Pick a name to show next to your question count. Your email is never shown. You can hide yourself any time.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FieldLabel label="Display name" className="sm:w-72">
          <TextInput
            id="leaderboard-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={20}
            autoComplete="nickname"
            placeholder="e.g. ICDC bound"
          />
        </FieldLabel>
        <Checkbox id="leaderboard-show" label="Show me on the leaderboard" checked={show} onChange={(event) => setShow(event.target.checked)} className="sm:pb-3" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {optedIn ? (
          <Button type="button" variant="ghost" onClick={() => { setName(displayName ?? ""); setMessage(null); setEditing(false); }}>
            Cancel
          </Button>
        ) : null}
        {status}
      </div>
    </form>
  );
}

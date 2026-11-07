import type { AttemptUpload, SaveStatus } from "@/lib/test-results-shared";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import { questionRef } from "@/lib/test-format";
import {
  loadCustomSession,
  newId,
  saveAttempt,
  type TestAttempt
} from "@/lib/test-progress";

// Browser side of saving results to the account: building the upload from a
// stored attempt, sending it, and finding older results that only exist in
// this browser so they can be imported.

// Which test or custom session an attempt belongs to.
export type UploadSource =
  | { mode: "full"; testId: string }
  | { mode: "custom"; refs: string[]; summary: string; selections?: Record<string, string[]> };

export function toUpload(attempt: TestAttempt & { id: string }, source: UploadSource): AttemptUpload {
  return {
    id: attempt.id,
    mode: source.mode,
    ...(source.mode === "full"
      ? { testId: source.testId }
      : { refs: source.refs, filters: { summary: source.summary, selections: source.selections } }),
    answers: Object.fromEntries(Object.entries(attempt.answers).map(([number, key]) => [number, key])),
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt ?? new Date().toISOString(),
    elapsedSeconds: typeof attempt.elapsedSeconds === "number" ? attempt.elapsedSeconds : null,
    timedOut: attempt.timedOut
  };
}

export async function uploadAttempts(uploads: AttemptUpload[]): Promise<{ status: SaveStatus; saved: string[] }> {
  try {
    const response = await fetch("/api/test-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempts: uploads })
    });
    const data = (await response.json()) as { status?: SaveStatus; saved?: string[] };
    return { status: data.status ?? (response.ok ? "saved" : "error"), saved: data.saved ?? [] };
  } catch {
    return { status: "error", saved: [] };
  }
}

// Saves (or clears, when empty) the signed-in user's note on a question.
export async function saveQuestionNote(ref: string, note: string) {
  try {
    const response = await fetch("/api/question-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, note })
    });
    return response.ok;
  } catch {
    return false;
  }
}

// The signed-in user's notes on these questions, keyed by the refs asked for.
export async function loadQuestionNotes(refs: string[]): Promise<Record<string, string> | null> {
  try {
    const response = await fetch("/api/question-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs })
    });
    if (!response.ok) return null;
    return ((await response.json()) as { notes?: Record<string, string> }).notes ?? {};
  } catch {
    return null;
  }
}

export async function deleteSavedAttempt(attemptId: string) {
  try {
    const response = await fetch(`/api/test-attempts/${attemptId}`, { method: "DELETE" });
    // Already gone counts as deleted.
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

async function postFlags(body: unknown) {
  try {
    const response = await fetch("/api/flagged-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Flags or unflags a question on the account. Unflagging takes every ref the
// question was flagged under (copies of it on other tests).
export function saveFlag(ref: string | string[], flagged: boolean) {
  return postFlags({ refs: Array.isArray(ref) ? ref : [ref], flagged });
}

// Custom session attempt keys, one per question set.
const CUSTOM_ATTEMPT_KEYS = new Map<string, QuestionSet>([
  [SET_ROUTES.deca.attemptKey, "deca"],
  [SET_ROUTES.original.attemptKey, "original"]
]);

// Removes this browser's copy of a deleted result, so it doesn't reappear as a
// "last score" or get imported again.
export function forgetLocalAttempt(attemptId: string) {
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    for (const key of keys) {
      if (!key || !(key.startsWith("prepplay:test:") || CUSTOM_ATTEMPT_KEYS.has(key))) continue;
      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (attempt?.id === attemptId) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing to clean up.
  }
}

type LocalResult = { key: string; attempt: TestAttempt & { id: string }; upload: AttemptUpload };

// Submitted results in this browser that haven't been saved to the account yet:
// the latest attempt of each full test and the last custom session of each set.
export function findUnsyncedLocalResults(): LocalResult[] {
  const results: LocalResult[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;

      const isFullTest = key.startsWith("prepplay:test:");
      const customSet = CUSTOM_ATTEMPT_KEYS.get(key);
      if (!isFullTest && !customSet) continue;

      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (!attempt || attempt.version !== 1 || attempt.status !== "submitted" || attempt.syncedAt) continue;

      let source: UploadSource;
      if (isFullTest) {
        source = { mode: "full", testId: attempt.testId };
      } else {
        const session = loadCustomSession(customSet);
        if (!session || session.id !== attempt.testId) continue;
        source = { mode: "custom", refs: session.refs, summary: session.summary, selections: session.filters };
      }

      const withId = { ...attempt, id: attempt.id ?? newId() };
      results.push({ key, attempt: withId, upload: toUpload(withId, source) });
    }
  } catch {
    // Storage unavailable: nothing to import.
  }

  return results;
}

// Sends flags this browser hasn't saved to the account: older attempts, and
// questions flagged while signed out or offline. Returns how many attempts sent any.
export async function importLocalFlags() {
  let sent = 0;
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    for (const key of keys) {
      if (!key) continue;
      const isFullTest = key.startsWith("prepplay:test:");
      const customSet = CUSTOM_ATTEMPT_KEYS.get(key);
      if (!isFullTest && !customSet) continue;

      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (!attempt || attempt.version !== 1) continue;
      const flagged = attempt.flagged ?? [];
      const numbers = (attempt.unsavedFlags ?? flagged).filter((number) => flagged.includes(number));
      if (numbers.length === 0) continue;

      let body: unknown;
      if (isFullTest) {
        body = { refs: numbers.map((number) => questionRef(attempt.testId, number)), flagged: true };
      } else {
        const session = loadCustomSession(customSet);
        if (!session || session.id !== attempt.testId) continue;
        body = { session: session.refs, numbers };
      }

      if (await postFlags(body)) {
        saveAttempt(key, { ...attempt, unsavedFlags: [] });
        sent += 1;
      }
    }
  } catch {
    // Storage unavailable: nothing to send.
  }
  return sent;
}

export async function importLocalResults() {
  const pending = findUnsyncedLocalResults();
  if (pending.length === 0) return 0;

  const { saved } = await uploadAttempts(pending.map((item) => item.upload));
  const syncedAt = new Date().toISOString();

  for (const item of pending) {
    if (saved.includes(item.attempt.id)) {
      saveAttempt(item.key, { ...item.attempt, syncedAt });
    }
  }

  return saved.length;
}

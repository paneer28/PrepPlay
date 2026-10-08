import type { AttemptUpload, SaveStatus } from "@/lib/test-results-shared";
import {
  CUSTOM_ATTEMPT_KEY,
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

export async function saveNote(attemptId: string, position: number, note: string) {
  try {
    const response = await fetch(`/api/test-attempts/${attemptId}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position, note })
    });
    return response.ok;
  } catch {
    return false;
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

// Removes this browser's copy of a deleted result, so it doesn't reappear as a
// "last score" or get imported again.
export function forgetLocalAttempt(attemptId: string) {
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    for (const key of keys) {
      if (!key || !(key.startsWith("prepplay:test:") || key === CUSTOM_ATTEMPT_KEY)) continue;
      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (attempt?.id === attemptId) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing to clean up.
  }
}

type LocalResult = { key: string; attempt: TestAttempt & { id: string }; upload: AttemptUpload };

// Submitted results in this browser that haven't been saved to the account yet:
// the latest attempt of each full test and the last custom session.
export function findUnsyncedLocalResults(): LocalResult[] {
  const results: LocalResult[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;

      const isFullTest = key.startsWith("prepplay:test:");
      if (!isFullTest && key !== CUSTOM_ATTEMPT_KEY) continue;

      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (!attempt || attempt.version !== 1 || attempt.status !== "submitted" || attempt.syncedAt) continue;

      let source: UploadSource;
      if (isFullTest) {
        source = { mode: "full", testId: attempt.testId };
      } else {
        const session = loadCustomSession();
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

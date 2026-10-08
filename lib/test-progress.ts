import type { TestOptionKey } from "@/types";

// Browser-only persistence for an in-progress or finished practice test, so a
// refresh or accidental close never loses answers. Full tests and the custom
// practice session are stored under separate keys.

// "end": answers stay hidden until submit (exam style). "instant": each answer is
// checked as soon as it's chosen, and then locked.
export type AnswerFeedback = "end" | "instant";

export type TestAttempt = {
  version: 1;
  // Also the id of the saved result on the account. Missing on saves made before
  // results were stored on accounts; one is assigned when the result is uploaded.
  id?: string;
  testId: string;
  questionCount: number;
  status: "in-progress" | "submitted";
  answers: Record<number, TestOptionKey>;
  flagged: number[];
  currentIndex: number;
  timerEnabled: boolean;
  // Missing on saves made before this option existed; those behave as "end".
  feedback?: AnswerFeedback;
  remainingSeconds: number | null;
  timedOut: boolean;
  startedAt: string;
  submittedAt: string | null;
  // Saved on submit so the test list can show the last score without the answer key.
  score?: { correct: number; total: number };
  // Seconds the exam was actually open (paused while the tab is hidden or closed).
  elapsedSeconds?: number;
  // Set once the submitted result has been saved to the signed-in account.
  syncedAt?: string;
  // Notes on missed questions, by question number (mirrors what's saved on the account).
  notes?: Record<number, string>;
};

// A UUID (the database key for a saved result). randomUUID needs a secure
// context, so fall back to building a v4 UUID by hand.
export function newId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const fullTestStorageKey = (testId: string) => `prepplay:test:${testId}`;
export const CUSTOM_SESSION_KEY = "prepplay:custom-session";
export const CUSTOM_ATTEMPT_KEY = "prepplay:custom-session:attempt";
const FEEDBACK_PREFERENCE_KEY = "prepplay:answer-feedback";

export type CustomSession = {
  version: 1;
  id: string;
  createdAt: string;
  summary: string;
  refs: string[];
  // The filter selections that built the session (saved with the result).
  filters?: Record<string, string[]>;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); the test still works without it.
  }
}

export function removeStored(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore: nothing to clear if storage is unavailable.
  }
}

export function loadAttempt(storageKey: string, testId: string, questionCount: number): TestAttempt | null {
  const attempt = readJson<TestAttempt>(storageKey);

  // Discard saves from an older shape, a different test or custom session, or a
  // version of the test whose question count has since changed.
  if (!attempt || attempt.version !== 1 || attempt.testId !== testId || attempt.questionCount !== questionCount) {
    return null;
  }

  return attempt;
}

export function saveAttempt(storageKey: string, attempt: TestAttempt) {
  writeJson(storageKey, attempt);
}

// What the test list shows for one test: nothing, "in progress", or the last score.
export type TestStatus =
  | { kind: "in-progress"; answered: number; total: number }
  | { kind: "completed"; correct: number | null; total: number };

export function loadTestStatus(testId: string, questionCount: number): TestStatus | null {
  const attempt = loadAttempt(fullTestStorageKey(testId), testId, questionCount);

  if (!attempt) {
    return null;
  }

  if (attempt.status === "in-progress") {
    return { kind: "in-progress", answered: Object.keys(attempt.answers).length, total: questionCount };
  }

  return { kind: "completed", correct: attempt.score?.correct ?? null, total: questionCount };
}

export function customSessionInProgress(): { answered: number; total: number } | null {
  const session = loadCustomSession();
  const attempt = session ? loadAttempt(CUSTOM_ATTEMPT_KEY, session.id, session.refs.length) : null;

  return attempt?.status === "in-progress"
    ? { answered: Object.keys(attempt.answers).length, total: attempt.questionCount }
    : null;
}

export function newCustomSession(refs: string[], summary: string, filters?: Record<string, string[]>): CustomSession {
  return {
    version: 1,
    id: newId(),
    createdAt: new Date().toISOString(),
    summary,
    refs,
    filters
  };
}

export function loadCustomSession(): CustomSession | null {
  const session = readJson<CustomSession>(CUSTOM_SESSION_KEY);
  return session?.version === 1 && Array.isArray(session.refs) && session.refs.length > 0 ? session : null;
}

export function saveCustomSession(session: CustomSession) {
  writeJson(CUSTOM_SESSION_KEY, session);
  removeStored(CUSTOM_ATTEMPT_KEY);
}

// The last feedback mode picked, so the intro screen remembers it between tests.
export function loadFeedbackPreference(): AnswerFeedback {
  return readJson<AnswerFeedback>(FEEDBACK_PREFERENCE_KEY) === "instant" ? "instant" : "end";
}

export function saveFeedbackPreference(feedback: AnswerFeedback) {
  writeJson(FEEDBACK_PREFERENCE_KEY, feedback);
}

export function createAttempt(
  testId: string,
  questionCount: number,
  timeLimitMinutes: number | null,
  timerEnabled: boolean,
  feedback: AnswerFeedback = "end"
): TestAttempt {
  return {
    version: 1,
    id: newId(),
    testId,
    questionCount,
    status: "in-progress",
    answers: {},
    flagged: [],
    currentIndex: 0,
    timerEnabled: timerEnabled && Boolean(timeLimitMinutes),
    feedback,
    remainingSeconds: timerEnabled && timeLimitMinutes ? timeLimitMinutes * 60 : null,
    timedOut: false,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    elapsedSeconds: 0
  };
}

import type { TestOptionKey } from "@/types";

// Shared by the browser (uploading results, editing notes) and the server
// (saving and reading them). No server-only imports here.

// Quick-pick note tags. Tag counts match notes that start with the tag text, so
// a tag followed by the user's own words still counts.
export const NOTE_TAGS = [
  "Misread the question",
  "Didn't know the concept",
  "Narrowed to two, guessed wrong",
  "Careless mistake"
] as const;

export const NOTE_MAX_LENGTH = 500;

// What the browser sends when a test or custom session is submitted. The
// server re-reads the questions and grades the answers itself.
export type AttemptUpload = {
  id: string;
  mode: "full" | "custom";
  // Full tests.
  testId?: string;
  // Custom sessions: the session's question refs and the filters that built it.
  refs?: string[];
  filters?: { summary: string; selections?: Record<string, string[]> };
  // Position in the attempt (1..N) → chosen option.
  answers: Record<string, TestOptionKey>;
  startedAt: string;
  submittedAt: string;
  elapsedSeconds: number | null;
  timedOut: boolean;
};

export type SaveStatus = "saved" | "signed-out" | "unavailable" | "error";

export const HISTORY_SORTS = ["newest", "oldest", "score-high", "score-low"] as const;
export type HistorySort = (typeof HISTORY_SORTS)[number];
export const HISTORY_MODES = ["all", "full", "custom"] as const;
export type HistoryMode = (typeof HISTORY_MODES)[number];
export const NOTE_FILTERS = ["any", "with", "without"] as const;
export type NoteFilter = (typeof NOTE_FILTERS)[number];

export const DASHBOARD_PAGE_SIZE = 10;

export function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return "–";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

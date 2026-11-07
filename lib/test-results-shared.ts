import type { TestOptionKey } from "@/types";

// Shared by the browser (uploading results, editing notes) and the server
// (saving and reading them). No server-only imports here.

// One note per question, shared by every list it shows up in.
export const NOTE_MAX_LENGTH = 2000;

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
  // Unlimited mode: a missed question can come back in the same session, so
  // its refs may repeat and each repeat is its own position.
  source?: "unlimited";
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

// The dashboard's review lists and how many questions one review page shows.
export const REVIEW_LISTS = ["missed", "flagged"] as const;
export type ReviewList = (typeof REVIEW_LISTS)[number];
export const REVIEW_PAGE_SIZE = 50;

// Anchor id for a question on a review page.
export function reviewAnchor(ref: string) {
  return `q-${ref.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

// Infinite sessions are saved as custom sessions with this summary prefix.
export function isInfiniteSummary(summary: string | null | undefined) {
  return Boolean(summary?.startsWith("Infinite ·"));
}

// The Tests tab's question-set toggle: everything, real DECA exams, or
// PrepPlay's original practice questions.
export const DASHBOARD_SETS = ["all", "deca", "original"] as const;
export type DashboardSet = (typeof DASHBOARD_SETS)[number];
export const DASHBOARD_SET_LABELS: Record<DashboardSet, string> = {
  all: "All",
  deca: "DECA exams",
  original: "Practice questions"
};

export function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return "–";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

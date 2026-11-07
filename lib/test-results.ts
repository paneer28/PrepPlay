import { cache } from "react";
import type { DateBounds } from "@/lib/date-range";
import { createClient } from "@/lib/supabase/server";
import { questionRef } from "@/lib/test-format";
import { originalClusterFor, originalSetNumber, type QuestionSet } from "@/lib/question-sets";
import {
  DASHBOARD_PAGE_SIZE,
  type AttemptUpload,
  type DashboardSet,
  type HistoryMode,
  type HistorySort,
  type SaveStatus,
  isInfiniteSummary
} from "@/lib/test-results-shared";
import { getAllTests, getQuestionLookup, getQuestionsByRefs, getTestById, isOriginal } from "@/lib/tests";
import { viewerHasTestsAccess } from "@/lib/tests-access-server";
import type { PracticeTest, TestOptionKey, TestQuestion } from "@/types";

// Server-side access to saved practice test results. Every read goes through a
// database function (see supabase/migrations/2026-10-08-test-results.sql) that
// returns totals already aggregated for the signed-in user.

/* ------------------------------------------------------------------ */
/* Saving                                                              */
/* ------------------------------------------------------------------ */

type AnswerRow = {
  position: number;
  source_test_id: string;
  source_number: number;
  pi_code: string;
  instructional_area: string;
  user_answer: TestOptionKey | null;
  is_correct: boolean;
  unanswered: boolean;
};

// Re-reads the questions from the test files and grades the answers here, so the
// saved score never depends on what the browser claims. Without the access code
// (`decaAccess`), only original questions can be saved: otherwise a made-up
// upload for a real exam would reveal its answers on the review page.
export function buildAttemptRecord(upload: AttemptUpload, decaAccess = true) {
  let questions: Array<{ position: number; question: TestQuestion; testId: string; number: number }>;
  let test: PracticeTest | undefined;

  if (upload.mode === "full") {
    test = upload.testId ? getTestById(upload.testId) : undefined;
    if (!test) return null;
    questions = test.questions.map((question) => ({
      position: question.number,
      question,
      testId: test!.id,
      number: question.number
    }));
  } else if (upload.source === "unlimited") {
    // Repeats are real (a missed question coming back), so no de-duplication:
    // every ref is its own position, as the browser numbered them.
    const lookup = getQuestionLookup();
    questions = (upload.refs ?? []).flatMap((ref, index) => {
      const question = lookup.get(ref);
      return question ? [{ position: index + 1, question, testId: question.origin!.testId, number: question.origin!.number }] : [];
    });
  } else {
    // Same lookup (and de-duplication) the session used, so positions line up.
    questions = getQuestionsByRefs(upload.refs ?? []).map((question, index) => ({
      position: index + 1,
      question,
      testId: question.origin!.testId,
      number: question.origin!.number
    }));
  }

  if (questions.length === 0) return null;
  const allOriginal = questions.every(({ question }) => question.origin?.original ?? isOriginal(test));
  if (!allOriginal && !decaAccess) return null;

  const answers: AnswerRow[] = questions.map(({ position, question, testId, number }) => {
    const chosen = upload.answers[String(position)] ?? null;
    return {
      position,
      source_test_id: testId,
      source_number: number,
      pi_code: question.performanceIndicator.code,
      instructional_area: question.performanceIndicator.instructionalArea?.trim() || "Other",
      user_answer: chosen,
      is_correct: chosen === question.answer,
      unanswered: chosen === null
    };
  });

  const clusters = new Set(
    questions.map(({ testId }) => getTestById(testId)?.cluster).filter((cluster): cluster is string => Boolean(cluster))
  );

  return {
    attempt: {
      id: upload.id,
      mode: upload.mode,
      test_id: test?.id ?? null,
      test_title: test?.title ?? null,
      // Custom sessions only get a cluster when every question came from one.
      cluster: test?.cluster ?? (clusters.size === 1 ? [...clusters][0] : null),
      filters: upload.mode === "custom" ? (upload.filters ?? null) : null,
      started_at: upload.startedAt,
      submitted_at: upload.submittedAt,
      total_questions: answers.length,
      answered_count: answers.filter((answer) => !answer.unanswered).length,
      correct_count: answers.filter((answer) => answer.is_correct).length,
      time_taken_seconds: upload.elapsedSeconds === null ? null : Math.max(0, Math.round(upload.elapsedSeconds)),
      timed_out: upload.timedOut,
      // Practice-question attempts are told apart on the dashboard by this.
      question_set: allOriginal ? "original" : "deca"
    },
    answers
  };
}

export async function saveAttemptUploads(
  uploads: AttemptUpload[],
  decaAccess: boolean
): Promise<{ status: SaveStatus; saved: string[] }> {
  const supabase = await createClient();
  if (!supabase) return { status: "unavailable", saved: [] };

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out", saved: [] };

  const saved: string[] = [];
  for (const upload of uploads) {
    const record = buildAttemptRecord(upload, decaAccess);
    if (!record) continue;

    const { error } = await supabase.rpc("save_test_attempt", { p_attempt: record.attempt, p_answers: record.answers });
    if (error) {
      return { status: error.code === "PGRST202" || error.code === "42P01" ? "unavailable" : "error", saved };
    }
    // Already-saved ids return false; they still count as saved.
    saved.push(upload.id);
  }

  return { status: "saved", saved };
}

export async function deleteAttempt(attemptId: string) {
  const supabase = await createClient();
  if (!supabase) return "unavailable" as const;

  const { data, error } = await supabase.rpc("delete_test_attempt", { p_attempt_id: attemptId });

  if (error) return "error" as const;
  return data ? ("deleted" as const) : ("not-found" as const);
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

// Every answer the signed-in user has saved on these tests, oldest first, for
// spaced review (lib/review.ts). Unanswered questions don't count. Empty when
// signed out or unavailable.
export async function getAnswerHistory(testIds: string[]) {
  const supabase = await createClient();
  if (!supabase || testIds.length === 0) return [];

  type Row = { source_test_id: string; source_number: number; is_correct: boolean; submitted_at: string; position: number };
  const rows: Row[] = [];
  const PAGE = 1000;
  // Supabase returns at most 1000 rows per request.
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from("test_attempt_answers")
      .select("source_test_id, source_number, is_correct, submitted_at, position")
      .in("source_test_id", testIds)
      .eq("unanswered", false)
      .order("submitted_at", { ascending: true })
      .order("position", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }

  // Answers within one attempt share a time; keep them in position order.
  return rows.map((row) => ({
    ref: questionRef(row.source_test_id, row.source_number),
    correct: row.is_correct,
    at: new Date(row.submitted_at).getTime() + row.position
  }));
}

// "unavailable" covers Supabase not being configured and the migration not having been run yet.
export type Loaded<T> = { ok: true; data: T } | { ok: false; reason: "unavailable" | "error" };

export async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<Loaded<T>> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    return { ok: false, reason: error.code === "PGRST202" || error.code === "42P01" ? "unavailable" : "error" };
  }
  return { ok: true, data: data as T };
}

export const rangeArgs = (bounds: DateBounds) => ({ p_from: bounds.from, p_to: bounds.to });
export const setArg = (set: DashboardSet) => ({ p_set: set === "all" ? null : set });

// Without the access code, real exam questions are never sent to the browser,
// even from saved results (rows can be written straight to the database).
export async function questionVisibility() {
  const decaAccess = await viewerHasTestsAccess();
  return (question: TestQuestion | undefined | null) => Boolean(question && (decaAccess || question.origin?.original));
}

// Short column label like "2019 State" (plus the test number when a year has two
// forms) and a cluster abbreviation like "BMA".
export function testLabels(testId: string | null, fallbackTitle: string | null) {
  const test = testId ? getTestById(testId) : undefined;
  if (!test) return { short: fallbackTitle ?? "Unknown test", cluster: "", year: null as number | null };

  // Original practice sets: "Set 2" and "MKT".
  if (isOriginal(test)) {
    const number = originalSetNumber(test.title);
    return { short: number ? `Set ${number}` : test.title, cluster: originalClusterFor(test.cluster)?.short ?? "", year: null };
  }

  const form = test.title.match(/\(Test (\d+)\)/)?.[1];
  const short = [test.year, test.event].filter(Boolean).join(" ") || test.title;
  const words = test.cluster.split(/\s+/).filter((word) => !["and", "of", "the"].includes(word.toLowerCase()));
  const cluster = words.length > 1 ? words.map((word) => word[0]).join("").toUpperCase() : test.cluster;

  return { short: form ? `${short} #${form}` : short, cluster, year: test.year };
}

/* Overview: summary cards, areas, PIs --------------------------------- */

type OverviewRaw = {
  summary: { answered: number; correct: number; full_tests: number; custom_sessions: number; best_full_pct: number | null };
  areas: Array<{ area: string; answered: number; correct: number }>;
  pis: Array<{ area: string; pi: string; answered: number; correct: number }>;
};

export type DashboardOverview = Omit<OverviewRaw, "pis"> & {
  pis: Array<OverviewRaw["pis"][number] & { text: string | null }>;
};

export const getOverview = cache(async (from: string | null, to: string | null, set: DashboardSet = "all"): Promise<Loaded<DashboardOverview>> => {
  const result = await callRpc<OverviewRaw>("test_dashboard_overview", { ...rangeArgs({ from, to }), p_tags: [], ...setArg(set) });
  if (!result.ok) return result;

  // PI descriptions live in the test files, not the database.
  const piText = new Map<string, string>();
  for (const test of getAllTests()) {
    for (const question of test.questions) {
      const { code, text } = question.performanceIndicator;
      if (text && !piText.has(code)) piText.set(code, text);
    }
  }

  const summary = result.data.summary;
  return {
    ok: true,
    data: {
      ...result.data,
      summary: { ...summary, best_full_pct: summary.best_full_pct === null ? null : Number(summary.best_full_pct) },
      pis: result.data.pis.map((pi) => ({ ...pi, text: piText.get(pi.pi) ?? null }))
    }
  };
});

/* Compare tests ---------------------------------------------------------- */

type CompareRaw = {
  attempts: Array<{
    id: string;
    test_id: string;
    test_title: string;
    cluster: string;
    submitted_at: string;
    total: number;
    correct: number;
    attempt_number: number;
    question_set: QuestionSet;
  }>;
  cells: Array<{ attempt_id: string; area: string; total: number; correct: number }>;
  trend: Array<{ id: string; test_id: string; test_title: string; submitted_at: string; total: number; correct: number }>;
};

export type CompareData = {
  attempts: Array<CompareRaw["attempts"][number] & { short: string; clusterShort: string }>;
  cells: CompareRaw["cells"];
  trend: Array<CompareRaw["trend"][number] & { short: string; clusterShort: string }>;
};

export async function getCompare(bounds: DateBounds, set: DashboardSet = "all"): Promise<Loaded<CompareData>> {
  const result = await callRpc<CompareRaw>("test_dashboard_compare", { ...rangeArgs(bounds), ...setArg(set) });
  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      attempts: result.data.attempts.map((attempt) => {
        const labels = testLabels(attempt.test_id, attempt.test_title);
        return { ...attempt, short: labels.short, clusterShort: labels.cluster };
      }),
      cells: result.data.cells,
      trend: result.data.trend.map((point) => {
        const labels = testLabels(point.test_id, point.test_title);
        return { ...point, short: labels.short, clusterShort: labels.cluster };
      })
    }
  };
}

/* History ------------------------------------------------------------------- */

export type HistoryFilters = { mode: HistoryMode; cluster: string | null; sort: HistorySort };

export type HistoryAttempt = {
  id: string;
  mode: "full" | "custom";
  test_id: string | null;
  test_title: string | null;
  cluster: string | null;
  filters: { summary?: string } | null;
  submitted_at: string;
  total: number;
  correct: number;
  time_taken_seconds: number | null;
  question_set: QuestionSet;
};

// One row of the history list: a single attempt, or every Infinite session
// from one day combined.
export type HistoryEntry =
  | { kind: "attempt"; key: string; day: string; attempt: HistoryAttempt }
  | {
      kind: "infinite-day";
      key: string;
      day: string;
      sessions: HistoryAttempt[];
      total: number;
      correct: number;
      seconds: number | null;
      clusters: string[];
      submitted_at: string;
    };

export const HISTORY_DAYS_PER_PAGE = 7;

function dayIn(value: string, timeZone: string) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(value));
}

const entryTime = (entry: HistoryEntry) => new Date(entry.kind === "attempt" ? entry.attempt.submitted_at : entry.submitted_at).getTime();
const entryScore = (entry: HistoryEntry) =>
  entry.kind === "attempt" ? entry.attempt.correct / entry.attempt.total : entry.total ? entry.correct / entry.total : 0;

// Every attempt in range, filtered, with each day's Infinite sessions grouped,
// then sorted. Date sorts page by day; score sorts page by row.
export async function getHistory(bounds: DateBounds, filters: HistoryFilters, page: number, set: DashboardSet, timeZone: string) {
  const result = await callRpc<HistoryAttempt[]>("test_history_all", { ...rangeArgs(bounds), ...setArg(set) });
  if (!result.ok) return result;

  const attempts = result.data;
  const clusters = Array.from(new Set(attempts.map((attempt) => attempt.cluster).filter((cluster): cluster is string => Boolean(cluster)))).sort();
  const matching = attempts.filter(
    (attempt) => (filters.mode === "all" || attempt.mode === filters.mode) && (!filters.cluster || attempt.cluster === filters.cluster)
  );

  const entries: HistoryEntry[] = [];
  const infiniteDays = new Map<string, Extract<HistoryEntry, { kind: "infinite-day" }>>();
  for (const attempt of matching) {
    const day = dayIn(attempt.submitted_at, timeZone);
    if (attempt.mode !== "custom" || !isInfiniteSummary(attempt.filters?.summary)) {
      entries.push({ kind: "attempt", key: attempt.id, day, attempt });
      continue;
    }
    let group = infiniteDays.get(day);
    if (!group) {
      group = { kind: "infinite-day", key: `infinite-${day}`, day, sessions: [], total: 0, correct: 0, seconds: null, clusters: [], submitted_at: attempt.submitted_at };
      infiniteDays.set(day, group);
      entries.push(group);
    }
    group.sessions.push(attempt);
    group.total += attempt.total;
    group.correct += attempt.correct;
    if (attempt.time_taken_seconds !== null) group.seconds = (group.seconds ?? 0) + attempt.time_taken_seconds;
    if (attempt.submitted_at > group.submitted_at) group.submitted_at = attempt.submitted_at;
    const cluster = attempt.cluster ?? "Mixed clusters";
    if (!group.clusters.includes(cluster)) group.clusters.push(cluster);
  }

  entries.sort((left, right) => {
    if (filters.sort === "oldest") return entryTime(left) - entryTime(right);
    if (filters.sort === "score-high") return entryScore(right) - entryScore(left) || entryTime(right) - entryTime(left);
    if (filters.sort === "score-low") return entryScore(left) - entryScore(right) || entryTime(right) - entryTime(left);
    return entryTime(right) - entryTime(left);
  });

  const byDay = filters.sort === "newest" || filters.sort === "oldest";
  let pages: HistoryEntry[][];
  if (byDay) {
    const days: HistoryEntry[][] = [];
    for (const entry of entries) {
      const last = days[days.length - 1];
      if (last && last[0].day === entry.day) last.push(entry);
      else days.push([entry]);
    }
    pages = [];
    for (let index = 0; index < days.length; index += HISTORY_DAYS_PER_PAGE) {
      pages.push(days.slice(index, index + HISTORY_DAYS_PER_PAGE).flat());
    }
  } else {
    pages = [];
    for (let index = 0; index < entries.length; index += DASHBOARD_PAGE_SIZE) pages.push(entries.slice(index, index + DASHBOARD_PAGE_SIZE));
  }

  const totalPages = Math.max(1, pages.length);
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    ok: true as const,
    data: {
      entries: pages[current - 1] ?? [],
      page: current,
      totalPages,
      byDay,
      attemptCount: matching.length,
      dayCount: new Set(entries.map((entry) => entry.day)).size,
      clusters
    }
  };
}

/* Attempt detail -------------------------------------------------------------- */

type DetailRaw = {
  attempt: {
    id: string;
    mode: "full" | "custom";
    test_id: string | null;
    test_title: string | null;
    cluster: string | null;
    filters: { summary?: string } | null;
    started_at: string;
    submitted_at: string;
    total: number;
    answered: number;
    correct: number;
    time_taken_seconds: number | null;
    timed_out: boolean;
    question_set: QuestionSet;
  };
  answers: Array<{
    position: number;
    source_test_id: string;
    source_number: number;
    pi_code: string;
    instructional_area: string;
    user_answer: TestOptionKey | null;
    is_correct: boolean;
    unanswered: boolean;
    note: string | null;
  }>;
};

export type AttemptDetail = {
  attempt: DetailRaw["attempt"];
  items: Array<DetailRaw["answers"][number] & { question: TestQuestion | null }>;
  // Real exam questions withheld because the access code hasn't been entered.
  locked: boolean;
};

export async function getAttemptDetail(attemptId: string): Promise<Loaded<AttemptDetail | null>> {
  const result = await callRpc<DetailRaw | null>("test_attempt_detail", { p_attempt_id: attemptId });
  if (!result.ok) return result;
  if (!result.data) return { ok: true, data: null };

  const lookup = getQuestionLookup();
  const visible = await questionVisibility();
  const found = result.data.answers.map((answer) => ({
    answer,
    question: lookup.get(questionRef(answer.source_test_id, answer.source_number)) ?? null
  }));
  return {
    ok: true,
    data: {
      attempt: result.data.attempt,
      items: found.map(({ answer, question }) => ({ ...answer, question: visible(question) ? question : null })),
      locked: found.some(({ question }) => question !== null && !visible(question))
    }
  };
}

/* Original practice sets ------------------------------------------------------ */

export type OriginalProgress = {
  sets: Map<string, { attempts: number; bestPct: number | null; lastAt: string }>;
  // Per original set, every answered question across full sets and custom practice.
  sources: Map<string, { answered: number; correct: number }>;
};

type OriginalProgressRaw = {
  sets: Array<{ test_id: string; attempts: number; best_pct: number | null; last_at: string }>;
  sources: Array<{ test_id: string; answered: number; correct: number }>;
};

// The signed-in user's progress on the original sets (null when signed out or
// when saved results aren't set up).
export async function getOriginalProgress(): Promise<OriginalProgress | null> {
  const result = await callRpc<OriginalProgressRaw>("original_set_progress", {});
  if (!result.ok) return null;
  return {
    sets: new Map(
      result.data.sets.map((row) => [
        row.test_id,
        { attempts: Number(row.attempts), bestPct: row.best_pct === null ? null : Number(row.best_pct), lastAt: row.last_at }
      ])
    ),
    sources: new Map(result.data.sources.map((row) => [row.test_id, { answered: Number(row.answered), correct: Number(row.correct) }]))
  };
}

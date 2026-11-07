import { normalizeTimeRange, type TimeRange } from "@/lib/date-range";
import {
  DASHBOARD_SETS,
  HISTORY_MODES,
  HISTORY_SORTS,
  NOTE_FILTERS,
  REVIEW_LISTS,
  type DashboardSet,
  type HistoryMode,
  type HistorySort,
  type NoteFilter,
  type ReviewList
} from "@/lib/test-results-shared";

// URL state for the Tests tab, so every view can be linked to and survives a
// refresh. Short keys keep the URLs readable:
//   range         time range
//   qs            question set: all, deca (real exams), original (practice questions)
//   rl rp         review lists: which list (missed, flagged), page
//   ma mt mn      review lists: area, test, note filter (shared by both lists)
//   hp hs hm hc   history: page, sort, mode, cluster
export type TestsTabParams = {
  range?: string;
  qs?: string;
  rl?: string;
  rp?: string;
  ma?: string;
  mt?: string;
  mn?: string;
  hp?: string;
  hs?: string;
  hm?: string;
  hc?: string;
};

export type TestsTabState = {
  range: TimeRange;
  set: DashboardSet;
  review: { list: ReviewList; page: number; area: string | null; test: string | null; note: NoteFilter };
  history: { page: number; sort: HistorySort; mode: HistoryMode; cluster: string | null };
};

function pageOf(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function oneOf<T extends string>(options: readonly T[], value: string | undefined, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

export function parseTestsParams(params: TestsTabParams): TestsTabState {
  return {
    range: normalizeTimeRange(params.range),
    set: oneOf(DASHBOARD_SETS, params.qs, "all"),
    review: {
      list: oneOf(REVIEW_LISTS, params.rl, "missed"),
      page: pageOf(params.rp),
      area: params.ma || null,
      test: params.mt || null,
      note: oneOf(NOTE_FILTERS, params.mn, "any")
    },
    history: {
      page: pageOf(params.hp),
      sort: oneOf(HISTORY_SORTS, params.hs, "newest"),
      mode: oneOf(HISTORY_MODES, params.hm, "all"),
      cluster: params.hc || null
    }
  };
}

const DEFAULTS: Partial<Record<keyof TestsTabParams, string>> = {
  range: "all",
  qs: "all",
  rl: "missed",
  rp: "1",
  mn: "any",
  hp: "1",
  hs: "newest",
  hm: "all"
};

// Builds a Tests tab URL from the current state with some values changed.
// Defaults are left out of the URL.
export function testsHref(state: TestsTabState, changes: Partial<Record<keyof TestsTabParams, string | number | null>>) {
  const values: Record<keyof TestsTabParams, string | number | null> = {
    range: state.range,
    qs: state.set,
    rl: state.review.list,
    rp: state.review.page,
    ma: state.review.area,
    mt: state.review.test,
    mn: state.review.note,
    hp: state.history.page,
    hs: state.history.sort,
    hm: state.history.mode,
    hc: state.history.cluster,
    ...changes
  };

  const search = new URLSearchParams({ tab: "tests" });
  for (const [key, value] of Object.entries(values) as Array<[keyof TestsTabParams, string | number | null]>) {
    if (value !== null && value !== "" && String(value) !== DEFAULTS[key]) {
      search.set(key, String(value));
    }
  }
  return `/account?${search.toString()}`;
}

// The review page for the current list and filters (part of the dashboard's
// state, so its back link returns to the same view). `page` is the review
// page's own page of questions.
export function reviewHref(state: TestsTabState, options: { list?: ReviewList; page?: number; anchor?: string } = {}) {
  const list = options.list ?? state.review.list;
  const search = new URLSearchParams();
  const values: Array<[string, string | null, string]> = [
    ["rl", list, "missed"],
    ["range", state.range, "all"],
    ["qs", state.set, "all"],
    ["ma", state.review.area, ""],
    ["mt", state.review.test, ""],
    ["mn", state.review.note, "any"],
    ["page", options.page ? String(options.page) : null, "1"]
  ];
  for (const [key, value, fallback] of values) {
    if (value && value !== fallback) search.set(key, value);
  }
  const query = search.toString();
  return `/account/review${query ? `?${query}` : ""}${options.anchor ? `#${options.anchor}` : ""}`;
}

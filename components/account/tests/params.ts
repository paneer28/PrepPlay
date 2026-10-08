import { normalizeTimeRange, type TimeRange } from "@/lib/date-range";
import {
  HISTORY_MODES,
  HISTORY_SORTS,
  NOTE_FILTERS,
  type HistoryMode,
  type HistorySort,
  type NoteFilter
} from "@/lib/test-results-shared";

// URL state for the Tests tab, so every view can be linked to and survives a
// refresh. Short keys keep the URLs readable:
//   range         time range
//   mp ma mt mn   missed questions: page, area, test, note filter
//   hp hs hm hc   history: page, sort, mode, cluster
export type TestsTabParams = {
  range?: string;
  mp?: string;
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
  missed: { page: number; area: string | null; test: string | null; note: NoteFilter };
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
    missed: {
      page: pageOf(params.mp),
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
  mp: "1",
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
    mp: state.missed.page,
    ma: state.missed.area,
    mt: state.missed.test,
    mn: state.missed.note,
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

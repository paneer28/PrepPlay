import { cache } from "react";
import type { DateBounds } from "@/lib/date-range";
import { getQuestionNotes } from "@/lib/question-notes";
import { createClient } from "@/lib/supabase/server";
import { questionRef } from "@/lib/test-format";
import { callRpc, questionVisibility, rangeArgs, setArg, testLabels, type Loaded } from "@/lib/test-results";
import { reviewAnchor, type DashboardSet, type NoteFilter, type ReviewList } from "@/lib/test-results-shared";
import { canonicalRef, getQuestionLookup, getTestById, isOriginal } from "@/lib/tests";
import type { TestOptionKey, TestQuestion } from "@/types";

// The dashboard's two review lists, Got wrong and Flagged. Copies of a question
// on several tests are one item, a question missed more than once is one item
// ("Missed 2×"), and both lists share one note per question.

export type ReviewItem = {
  // The question's canonical ref (see getQuestionCopies).
  ref: string;
  anchor: string;
  // Every test the question was missed or flagged on, for the Test filter.
  testIds: string[];
  area: string;
  sourceLabel: string;
  number: number;
  questionText: string;
  // Null when the question is gone or the viewer can't see it, so the answer is never sent.
  question: TestQuestion | null;
  missed: number;
  lastMissed: string | null;
  // The answer given the last time it was missed.
  lastAnswer: TestOptionKey | null;
  unanswered: boolean;
  flaggedAt: string | null;
  // Every ref it is flagged under, so removing the flag clears them all.
  flagRefs: string[];
  note: string | null;
};

export type ReviewFilters = { area: string | null; test: string | null; note: NoteFilter };

export type ReviewData = {
  missed: ReviewItem[];
  flagged: ReviewItem[];
  // False until the flagged-questions migration has been run.
  flagsAvailable: boolean;
  notesAvailable: boolean;
};

type MissedRaw = Array<{
  source_test_id: string;
  source_number: number;
  area: string;
  missed: number;
  last_missed: string;
  attempt_id: string;
  position: number;
  user_answer: TestOptionKey | null;
  unanswered: boolean;
}>;

const MAX_FLAGS = 5000;

function splitRef(ref: string) {
  const at = ref.lastIndexOf("#");
  return { testId: ref.slice(0, at), number: Number(ref.slice(at + 1)) };
}

function sourceLabelFor(testId: string) {
  const labels = testLabels(testId, null);
  return `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}`;
}

async function loadFlags(bounds: DateBounds, set: DashboardSet) {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const };

  let query = supabase.from("flagged_questions").select("ref, flagged_at").order("flagged_at", { ascending: false }).limit(MAX_FLAGS);
  if (bounds.from) query = query.gte("flagged_at", bounds.from);
  if (bounds.to) query = query.lt("flagged_at", bounds.to);
  const { data, error } = await query;
  if (error) return { ok: false as const };

  return {
    ok: true as const,
    rows: data.filter(({ ref }) => set === "all" || isOriginal(getTestById(splitRef(ref).testId)) === (set === "original"))
  };
}

// Both lists for one time range and question set. Cached per request, so the
// dashboard's summary counts and the list share one read.
export const getReviewData = cache(async (from: string | null, to: string | null, set: DashboardSet): Promise<Loaded<ReviewData>> => {
  const bounds = { from, to };
  const [missedResult, flags, notes, visible] = await Promise.all([
    callRpc<MissedRaw>("test_missed_questions", { ...rangeArgs(bounds), ...setArg(set) }),
    loadFlags(bounds, set),
    getQuestionNotes(),
    questionVisibility()
  ]);
  if (!missedResult.ok) return missedResult;

  const lookup = getQuestionLookup();
  const items = new Map<string, ReviewItem>();
  const itemFor = (sourceRef: string, fallbackArea: string | null) => {
    const ref = canonicalRef(sourceRef);
    let item = items.get(ref);
    if (!item) {
      const question = lookup.get(ref) ?? lookup.get(sourceRef) ?? null;
      const { testId, number } = splitRef(sourceRef);
      item = {
        ref,
        anchor: reviewAnchor(ref),
        testIds: [],
        area: question?.performanceIndicator.instructionalArea?.trim() || fallbackArea || "Other",
        sourceLabel: sourceLabelFor(testId),
        number,
        questionText: !question
          ? "This question is no longer available."
          : visible(question)
            ? question.question.replace(/\s+/g, " ")
            : "Enter the access code to see this DECA exam question.",
        question: question && visible(question) ? question : null,
        missed: 0,
        lastMissed: null,
        lastAnswer: null,
        unanswered: false,
        flaggedAt: null,
        flagRefs: [],
        note: notes.ok ? (notes.notes.get(ref) ?? null) : null
      };
      items.set(ref, item);
    }
    const { testId } = splitRef(sourceRef);
    if (!item.testIds.includes(testId)) item.testIds.push(testId);
    return item;
  };

  // Newest miss first, so the first row seen for a question is its latest miss.
  for (const row of missedResult.data) {
    const sourceRef = questionRef(row.source_test_id, row.source_number);
    const item = itemFor(sourceRef, row.area);
    item.missed += Number(row.missed);
    if (!item.lastMissed || row.last_missed > item.lastMissed) {
      item.lastMissed = row.last_missed;
      item.lastAnswer = row.user_answer;
      item.unanswered = row.unanswered;
      item.sourceLabel = sourceLabelFor(row.source_test_id);
      item.number = row.source_number;
    }
  }

  for (const row of flags.ok ? flags.rows : []) {
    const item = itemFor(row.ref, null);
    item.flagRefs.push(row.ref);
    if (!item.flaggedAt || row.flagged_at > item.flaggedAt) item.flaggedAt = row.flagged_at;
    if (item.missed === 0) {
      const { testId, number } = splitRef(row.ref);
      item.sourceLabel = sourceLabelFor(testId);
      item.number = number;
    }
  }

  const all = Array.from(items.values());
  return {
    ok: true,
    data: {
      missed: all.filter((item) => item.missed > 0).sort((left, right) => (right.lastMissed ?? "").localeCompare(left.lastMissed ?? "")),
      flagged: all.filter((item) => item.flaggedAt).sort((left, right) => (right.flaggedAt ?? "").localeCompare(left.flaggedAt ?? "")),
      flagsAvailable: flags.ok,
      notesAvailable: notes.ok
    }
  };
});

export function filterReviewItems(items: ReviewItem[], filters: ReviewFilters) {
  return items.filter(
    (item) =>
      (!filters.area || item.area === filters.area) &&
      (!filters.test || item.testIds.includes(filters.test)) &&
      (filters.note === "any" || (filters.note === "with") === Boolean(item.note))
  );
}

// Choices for the Area and Test filters, from one list.
export function reviewFilterOptions(items: ReviewItem[]) {
  const areas = Array.from(new Set(items.map((item) => item.area))).sort();
  const tests = Array.from(new Set(items.flatMap((item) => item.testIds)))
    .map((id) => {
      const labels = testLabels(id, id);
      return { id, label: `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}`, year: labels.year ?? 0 };
    })
    .sort((left, right) => right.year - left.year || left.label.localeCompare(right.label));
  return { areas, tests };
}

export function reviewItemsFor(data: ReviewData, list: ReviewList) {
  return list === "flagged" ? data.flagged : data.missed;
}

// Refs to practice: each question once, under a ref the session can load.
export function practiceRefs(items: ReviewItem[]) {
  const lookup = getQuestionLookup();
  const refs = items.map((item) => item.ref).filter((ref) => lookup.has(ref));
  const allOriginal = refs.every((ref) => lookup.get(ref)?.origin?.original);
  return { refs, set: allOriginal ? ("original" as const) : ("deca" as const) };
}

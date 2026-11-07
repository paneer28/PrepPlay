import { cookies } from "next/headers";
import { Suspense } from "react";
import { Achievements } from "@/components/account/Achievements";
import { AreaBreakdown } from "@/components/account/tests/AreaBreakdown";
import { CompareTests } from "@/components/account/tests/CompareTests";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { FilterButton } from "@/components/account/tests/FilterButton";
import { HistorySection } from "@/components/account/tests/HistorySection";
import { parseTestsParams, testsHref, type TestsTabParams, type TestsTabState } from "@/components/account/tests/params";
import { ReviewSection } from "@/components/account/tests/ReviewSection";
import { SectionSkeleton, SummarySkeleton } from "@/components/account/tests/Skeletons";
import { TestsTabEffects } from "@/components/account/tests/TestsTabEffects";
import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { StatTile } from "@/components/ds/StatTile";
import { getActivityTimestamps } from "@/lib/activity";
import { normalizeTimezone, rangeBounds, TIME_RANGE_LABELS, TIME_RANGES, TIMEZONE_COOKIE, type DateBounds } from "@/lib/date-range";
import { customAreaHref } from "@/lib/question-sets";
import { getReviewData } from "@/lib/review-lists";
import { percentOf } from "@/lib/score-scale";
import { DASHBOARD_SETS, type DashboardSet } from "@/lib/test-results-shared";
import { getCompare, getOverview, type CompareData, type DashboardOverview, type Loaded } from "@/lib/test-results";

export type { TestsTabParams };

const SET_FILTER_LABELS: Record<DashboardSet, string> = {
  all: "All questions",
  deca: "DECA exams",
  original: "Practice questions"
};
// An area needs this many answers before it can be called the weakest.
const WEAKEST_MIN = 5;

// The dashboard's Tests tab: one scrolling page whose every section follows
// the time and question-set filter, computed on the server in the viewer's timezone.
export async function TestsTab({ userId, params }: { userId: string; params: TestsTabParams }) {
  const state = parseTestsParams(params);
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const bounds = rangeBounds(state.range, timeZone);

  return (
    <div className="space-y-6">
      <TestsTabEffects />

      {/* Changing the set resets filters that may not exist in the other set. */}
      <FilterButton
        range={state.range}
        set={state.set}
        rangeOptions={TIME_RANGES.map((range) => ({ value: range, label: TIME_RANGE_LABELS[range], href: testsHref(state, { range, rp: 1, hp: 1 }) }))}
        setOptions={DASHBOARD_SETS.map((set) => ({
          value: set,
          label: SET_FILTER_LABELS[set],
          href: testsHref(state, { qs: set, rp: 1, hp: 1, ma: null, mt: null, hc: null })
        }))}
      />

      <Suspense key={`${state.range}-${state.set}`} fallback={<SummarySkeleton />}>
        <TestsBody userId={userId} state={state} bounds={bounds} timeZone={timeZone} />
      </Suspense>
    </div>
  );
}

async function TestsBody({
  userId,
  state,
  bounds,
  timeZone
}: {
  userId: string;
  state: TestsTabState;
  bounds: DateBounds;
  timeZone: string;
}) {
  const [overview, allTime, activity, compare, review] = await Promise.all([
    getOverview(bounds.from, bounds.to, state.set),
    // Achievements stay all-time and across both sets.
    state.range === "all" && state.set === "all" ? null : getOverview(null, null),
    getActivityTimestamps(userId),
    getCompare(bounds, state.set),
    getReviewData(bounds.from, bounds.to, state.set)
  ]);

  if (!overview.ok) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Illustration kind="empty" size={120} />
        <h2 className="mt-5 font-display text-h3 font-extrabold text-fg">Test results aren&apos;t available right now</h2>
        <p className="mt-2 max-w-md text-fg">
          {overview.reason === "unavailable"
            ? "Saved test results haven't been set up for this site yet. Your results are still kept in this browser and will appear here once they are."
            : "Something went wrong while loading your results. Try again in a moment."}
        </p>
      </div>
    );
  }

  const data = overview.data;
  const practiceSet = state.set === "original" ? "original" : "deca";
  const lifetime = allTime ? (allTime.ok ? allTime.data.summary : null) : data.summary;
  const achievements = lifetime ? (
    <Achievements
      fullTests={lifetime.full_tests}
      testsCompleted={lifetime.full_tests + lifetime.custom_sessions}
      bestFullPercent={lifetime.best_full_pct}
      timestamps={activity}
    />
  ) : null;

  if (data.summary.answered === 0) {
    return (
      <div className="space-y-8">
        <EmptyState range={state.range} set={state.set} />
        <ReviewSection state={state} result={review} timeZone={timeZone} />
        {achievements}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SummaryCard summary={data.summary} areas={data.areas} practiceSet={practiceSet} />
      <StatCards summary={data.summary} compare={compare} />
      <AreaBreakdown areas={data.areas} pis={data.pis} practiceSet={practiceSet} />
      <ReviewSection state={state} result={review} timeZone={timeZone} />
      <FullTestsSection compare={compare} timeZone={timeZone} set={state.set} />
      <Suspense fallback={<SectionSkeleton rows={6} />}>
        <HistorySection state={state} bounds={bounds} timeZone={timeZone} />
      </Suspense>
      {achievements}
    </div>
  );
}

function EmptyState({ range, set }: { range: TestsTabState["range"]; set: DashboardSet }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Illustration kind="chart" size={140} />
      <h2 className="mt-6 font-display text-h3 font-extrabold text-fg">
        {range === "all" ? "No test results yet" : `Nothing yet ${TIME_RANGE_LABELS[range].toLowerCase()}`}
      </h2>
      <p className="mt-2 max-w-md text-fg">
        {range === "all"
          ? "Finish a full test or a custom practice session while signed in and your scores, weak areas, and missed questions will show up here."
          : "You haven't submitted a test in this time range. Take one now, or switch to All time to see earlier results."}
      </p>
      <StartButton set={set} className="mt-6" />
    </div>
  );
}

function StartButton({ set, className = "" }: { set: DashboardSet; className?: string }) {
  return set === "original" ? (
    <ButtonLink href="/learn" size="lg" className={className}>
      Go to Practice questions
    </ButtonLink>
  ) : (
    <ButtonLink href="/exams" size="lg" className={className}>
      Go to Practice Tests
    </ButtonLink>
  );
}

// One sentence: overall success rate, weakest area, and the area costing the
// most points, with a button to practice the weakest one.
function SummaryCard({
  summary,
  areas,
  practiceSet
}: {
  summary: DashboardOverview["summary"];
  areas: DashboardOverview["areas"];
  practiceSet: "original" | "deca";
}) {
  const rate = percentOf(summary.correct, summary.answered);
  const scored = areas.filter((area) => area.answered >= WEAKEST_MIN);
  const weakest = [...(scored.length ? scored : areas)].sort(
    (left, right) => left.correct / left.answered - right.correct / right.answered || right.answered - left.answered
  )[0];
  const costliest = [...areas]
    .filter((area) => area.answered > area.correct)
    .sort((left, right) => right.answered - right.correct - (left.answered - left.correct) || left.area.localeCompare(right.area))[0];

  const rateTone = rate >= 80 ? "text-correct-text" : rate < 60 ? "text-wrong-text" : "text-brand-text";

  return (
    <section aria-labelledby="glance-title" className="flex flex-col gap-5 rounded-card bg-brand-tint p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-1.5">
        <p className="text-label font-bold text-brand-text">Your tests at a glance</p>
        <h2 id="glance-title" className="font-display text-h3 font-extrabold text-fg sm:text-h2">
          You&apos;re getting <span className={rateTone}>{rate}%</span> right
        </h2>
        <p className="text-small text-fg-muted">
          {weakest ? (
            <>
              Weakest area: <span className="font-bold text-fg">{weakest.area}</span>, {percentOf(weakest.correct, weakest.answered)}% (
              {weakest.correct} of {weakest.answered}).{" "}
            </>
          ) : null}
          {costliest ? (
            <>
              Most points lost: <span className="font-bold text-fg">{costliest.area}</span>, {costliest.answered - costliest.correct} missed.
            </>
          ) : (
            "You haven't missed a question yet."
          )}
        </p>
      </div>
      {weakest && costliest ? (
        <ButtonLink href={customAreaHref(practiceSet, weakest.area)} size="lg" className="shrink-0 max-lg:w-full">
          Practice {weakest.area}
        </ButtonLink>
      ) : null}
    </section>
  );
}

function StatCards({ summary, compare }: { summary: DashboardOverview["summary"]; compare: Loaded<CompareData> }) {
  const completed = summary.full_tests + summary.custom_sessions;
  const best =
    compare.ok && compare.data.trend.length
      ? compare.data.trend.reduce((top, point) => (point.correct / point.total > top.correct / top.total ? point : top))
      : null;
  const bestName = best ? `${best.clusterShort ? `${best.clusterShort} ` : ""}${best.short}` : null;

  return (
    <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatTile boxed className="max-sm:p-4" value={summary.answered.toLocaleString()} label="Questions answered" detail="Across every test and session you submitted." />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={`${percentOf(summary.correct, summary.answered)}%`}
        label="Success rate"
        detail={`${summary.correct.toLocaleString()} of ${summary.answered.toLocaleString()} correct`}
      />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={completed}
        label="Tests completed"
        detail={`${summary.full_tests} full ${summary.full_tests === 1 ? "test" : "tests"} · ${summary.custom_sessions} custom and Infinite ${
          summary.custom_sessions === 1 ? "session" : "sessions"
        }`}
      />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={summary.best_full_pct === null ? "--" : `${Math.round(summary.best_full_pct)}%`}
        label="Best full test"
        detail={summary.best_full_pct === null ? "Finish a full test to set your best score." : (bestName ?? "Highest full-test score in this range.")}
      />
    </section>
  );
}

function FullTestsSection({ compare, timeZone, set }: { compare: Loaded<CompareData>; timeZone: string; set: DashboardSet }) {
  return (
    <DashboardSection
      title="Full tests"
      description="Your full-test scores over time, and your latest attempt at each test compared area by area. Custom sessions aren't included."
    >
      {!compare.ok ? (
        <p className="p-5 text-fg sm:p-6">Couldn&apos;t load your full tests right now.</p>
      ) : compare.data.trend.length === 0 ? (
        <div className="flex flex-col items-center p-6 text-center">
          <Illustration kind="chart" size={110} />
          <p className="mt-4 max-w-md text-fg">No full tests in this range yet. Finish one to see your score over time and compare tests by area.</p>
          <StartButton set={set} className="mt-5" />
        </div>
      ) : (
        <CompareTests data={compare.data} timeZone={timeZone} />
      )}
    </DashboardSection>
  );
}

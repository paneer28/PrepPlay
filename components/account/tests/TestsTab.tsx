import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Achievements } from "@/components/account/Achievements";
import { AreaBreakdown } from "@/components/account/tests/AreaBreakdown";
import { CompareSection } from "@/components/account/tests/CompareSection";
import { HistorySection } from "@/components/account/tests/HistorySection";
import { MissedSection } from "@/components/account/tests/MissedSection";
import { parseTestsParams, testsHref, type TestsTabParams, type TestsTabState } from "@/components/account/tests/params";
import { SectionSkeleton, SummarySkeleton } from "@/components/account/tests/Skeletons";
import { TestsTabEffects } from "@/components/account/tests/TestsTabEffects";
import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { getActivityTimestamps } from "@/lib/activity";
import { normalizeTimezone, rangeBounds, TIME_RANGE_LABELS, TIME_RANGES, TIMEZONE_COOKIE, type DateBounds } from "@/lib/date-range";
import { percentOf } from "@/lib/score-scale";
import { customAreaHref } from "@/lib/question-sets";
import { DASHBOARD_SET_LABELS, DASHBOARD_SETS, type DashboardSet } from "@/lib/test-results-shared";
import { getOverview, type DashboardOverview } from "@/lib/test-results";

export type { TestsTabParams };

const FOCUS_MIN_ANSWERED = 30;

// The dashboard's Tests tab. Every number reflects the selected time range,
// computed on the server in the viewer's timezone.
export async function TestsTab({ userId, params }: { userId: string; params: TestsTabParams }) {
  const state = parseTestsParams(params);
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const bounds = rangeBounds(state.range, timeZone);

  return (
    <div className="space-y-6">
      <TestsTabEffects />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Time range">
          <SegmentedControl
            label="Time range"
            value={state.range}
            scroll={false}
            items={TIME_RANGES.map((range) => ({
              value: range,
              label: TIME_RANGE_LABELS[range],
              href: testsHref(state, { range, mp: 1, hp: 1 })
            }))}
          />
        </nav>
        {/* Changing the set resets filters that may not exist in the other set. */}
        <nav aria-label="Question set">
          <SegmentedControl<DashboardSet>
            label="Question set"
            value={state.set}
            scroll={false}
            items={DASHBOARD_SETS.map((set) => ({
              value: set,
              label: DASHBOARD_SET_LABELS[set],
              href: testsHref(state, { qs: set, mp: 1, hp: 1, ma: null, mt: null, hc: null })
            }))}
          />
        </nav>
      </div>

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
  // Achievements are all-time, whatever range is selected.
  const [overview, allTime, activity] = await Promise.all([
    getOverview(bounds.from, bounds.to, state.set),
    // Achievements stay all-time and across both sets.
    state.range === "all" && state.set === "all" ? null : getOverview(null, null),
    getActivityTimestamps(userId)
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
        {achievements}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SummaryCards summary={data.summary} />
      {achievements}
      {data.summary.answered >= FOCUS_MIN_ANSWERED ? <FocusAreas areas={data.areas} set={state.set} /> : null}
      <AreaBreakdown areas={data.areas} pis={data.pis} practiceSet={state.set === "original" ? "original" : "deca"} />

      <Suspense fallback={<SectionSkeleton rows={5} />}>
        <CompareSection bounds={bounds} timeZone={timeZone} set={state.set} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton rows={6} />}>
        <MissedSection state={state} bounds={bounds} tags={data.tags} timeZone={timeZone} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton rows={6} />}>
        <HistorySection state={state} bounds={bounds} timeZone={timeZone} />
      </Suspense>
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
      {set === "original" ? (
        <ButtonLink href="/learn" size="lg" className="mt-6">
          Go to Practice questions
        </ButtonLink>
      ) : (
        <ButtonLink href="/exams" size="lg" className="mt-6">
          Go to Practice Tests
        </ButtonLink>
      )}
    </div>
  );
}

function SummaryCards({ summary }: { summary: DashboardOverview["summary"] }) {
  const completed = summary.full_tests + summary.custom_sessions;

  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatTile boxed className="max-sm:p-4" value={summary.answered} label="Questions answered" detail="Across every test and session you submitted." />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={`${percentOf(summary.correct, summary.answered)}%`}
        label="Success rate"
        detail={`${summary.correct} of ${summary.answered} correct`}
      />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={completed}
        label="Tests completed"
        detail={`${summary.full_tests} full ${summary.full_tests === 1 ? "test" : "tests"} · ${summary.custom_sessions} custom ${
          summary.custom_sessions === 1 ? "session" : "sessions"
        }`}
      />
      <StatTile
        boxed
        className="max-sm:p-4"
        value={summary.best_full_pct === null ? "--" : `${Math.round(summary.best_full_pct)}%`}
        label="Best full test"
        detail={summary.best_full_pct === null ? "Finish a full test to set your best score." : "Highest full-test score in this range."}
      />
    </section>
  );
}

// The areas costing the most points: ranked by questions missed, not by percent,
// so a 1-question area at 0% doesn't outrank a 20-question area at 70%.
function FocusAreas({ areas, set }: { areas: DashboardOverview["areas"]; set: DashboardSet }) {
  const ranked = areas
    .map((area) => ({ ...area, missed: area.answered - area.correct }))
    .filter((area) => area.missed > 0)
    .sort((left, right) => right.missed - left.missed || left.area.localeCompare(right.area))
    .slice(0, 5);

  if (ranked.length === 0) return null;

  return (
    <section aria-labelledby="focus-title" className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="focus-title" className="font-display text-h3 font-extrabold text-fg">
          Where you&apos;re losing the most points
        </h2>
        <p className="text-small font-bold text-fg-muted">Ranked by questions missed</p>
      </div>
      <ol className="mt-3 divide-y-[1.5px] divide-rule">
        {ranked.map((area, index) => (
          <li key={area.area} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-tint font-display text-small font-extrabold text-brand-text">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 font-bold text-fg">{area.area}</span>
            <span className="text-small font-semibold text-fg-muted tabular-nums">
              missed {area.missed} of {area.answered}
            </span>
            <Link
              href={customAreaHref(set === "original" ? "original" : "deca", area.area)}
              className="inline-flex items-center gap-1 text-small font-bold text-brand-text hover:underline"
              aria-label={`Practice ${area.area}`}
            >
              Practice
              <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AreaBreakdown } from "@/components/account/tests/AreaBreakdown";
import { CompareSection } from "@/components/account/tests/CompareSection";
import { HistorySection } from "@/components/account/tests/HistorySection";
import { MissedSection } from "@/components/account/tests/MissedSection";
import { parseTestsParams, testsHref, type TestsTabParams, type TestsTabState } from "@/components/account/tests/params";
import { SectionSkeleton, SummarySkeleton } from "@/components/account/tests/Skeletons";
import { TestsTabEffects } from "@/components/account/tests/TestsTabEffects";
import { PillLink } from "@/components/account/tests/ui";
import { normalizeTimezone, rangeBounds, TIME_RANGE_LABELS, TIME_RANGES, TIMEZONE_COOKIE, type DateBounds } from "@/lib/date-range";
import { percentOf } from "@/lib/score-scale";
import { getOverview, type DashboardOverview } from "@/lib/test-results";

export type { TestsTabParams };

const FOCUS_MIN_ANSWERED = 30;

// The dashboard's Tests tab. Every number reflects the selected time range,
// computed on the server in the viewer's timezone.
export async function TestsTab({ params }: { userId: string; params: TestsTabParams }) {
  const state = parseTestsParams(params);
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const bounds = rangeBounds(state.range, timeZone);

  return (
    <div className="space-y-6">
      <TestsTabEffects />

      <nav aria-label="Time range" className="flex flex-wrap gap-2">
        {TIME_RANGES.map((range) => (
          <PillLink
            key={range}
            active={range === state.range}
            href={testsHref(state, { range, mp: 1, hp: 1 })}
          >
            {TIME_RANGE_LABELS[range]}
          </PillLink>
        ))}
      </nav>

      <Suspense key={state.range} fallback={<SummarySkeleton />}>
        <TestsBody state={state} bounds={bounds} timeZone={timeZone} />
      </Suspense>
    </div>
  );
}

async function TestsBody({ state, bounds, timeZone }: { state: TestsTabState; bounds: DateBounds; timeZone: string }) {
  const overview = await getOverview(bounds.from, bounds.to);

  if (!overview.ok) {
    return (
      <div className="surface px-6 py-12 text-center">
        <h2 className="text-xl font-bold tracking-[-0.03em] text-ink">Test results aren&apos;t available right now</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          {overview.reason === "unavailable"
            ? "Saved test results haven't been set up for this site yet. Your results are still kept in this browser and will appear here once they are."
            : "Something went wrong while loading your results. Try again in a moment."}
        </p>
      </div>
    );
  }

  const data = overview.data;
  if (data.summary.answered === 0) {
    return <EmptyState range={state.range} />;
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={data.summary} />
      {data.summary.answered >= FOCUS_MIN_ANSWERED ? <FocusAreas areas={data.areas} /> : null}
      <AreaBreakdown areas={data.areas} pis={data.pis} />

      <Suspense fallback={<SectionSkeleton rows={5} />}>
        <CompareSection bounds={bounds} timeZone={timeZone} />
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

function EmptyState({ range }: { range: TestsTabState["range"] }) {
  return (
    <div className="surface px-6 py-14 text-center">
      <p className="eyebrow">Practice tests</p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-ink">
        {range === "all" ? "No test results yet" : `Nothing yet ${TIME_RANGE_LABELS[range].toLowerCase()}`}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {range === "all"
          ? "Finish a full test or a custom practice session while signed in and your scores, weak areas, and missed questions will show up here."
          : "You haven't submitted a test in this time range. Take one now, or switch to All time to see earlier results."}
      </p>
      <Link
        href="/tests"
        className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
      >
        Go to Practice Tests
      </Link>
    </div>
  );
}

function SummaryCards({ summary }: { summary: DashboardOverview["summary"] }) {
  const completed = summary.full_tests + summary.custom_sessions;

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <article className="surface-soft p-6">
        <p className="eyebrow">Questions answered</p>
        <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">{summary.answered}</p>
        <p className="mt-2 text-sm leading-7 text-muted">Across every test and session you submitted.</p>
      </article>
      <article className="surface-soft p-6">
        <p className="eyebrow">Success rate</p>
        <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">
          {percentOf(summary.correct, summary.answered)}%
        </p>
        <p className="mt-2 text-sm leading-7 text-muted tabular-nums">
          {summary.correct} of {summary.answered} correct
        </p>
      </article>
      <article className="surface-soft p-6">
        <p className="eyebrow">Tests completed</p>
        <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">{completed}</p>
        <p className="mt-2 text-sm leading-7 text-muted tabular-nums">
          {summary.full_tests} full {summary.full_tests === 1 ? "test" : "tests"} · {summary.custom_sessions} custom{" "}
          {summary.custom_sessions === 1 ? "session" : "sessions"}
        </p>
      </article>
      <article className="surface-soft p-6">
        <p className="eyebrow">Best full test</p>
        <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">
          {summary.best_full_pct === null ? "--" : `${Math.round(summary.best_full_pct)}%`}
        </p>
        <p className="mt-2 text-sm leading-7 text-muted">
          {summary.best_full_pct === null ? "Finish a full test to set your best score." : "Highest full-test score in this range."}
        </p>
      </article>
    </section>
  );
}

// The areas costing the most points: ranked by questions missed, not by percent,
// so a 1-question area at 0% doesn't outrank a 20-question area at 70%.
function FocusAreas({ areas }: { areas: DashboardOverview["areas"] }) {
  const ranked = areas
    .map((area) => ({ ...area, missed: area.answered - area.correct }))
    .filter((area) => area.missed > 0)
    .sort((left, right) => right.missed - left.missed || left.area.localeCompare(right.area))
    .slice(0, 5);

  if (ranked.length === 0) return null;

  return (
    <section className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="eyebrow">Focus areas</p>
          <h2 className="mt-1.5 text-xl font-bold tracking-[-0.03em] text-ink">Where you&apos;re losing the most points</h2>
        </div>
        <p className="text-sm text-muted">Ranked by questions missed</p>
      </div>
      <ol className="mt-5 grid gap-2.5">
        {ranked.map((area, index) => (
          <li
            key={area.area}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[1.2rem] border border-line bg-white px-4 py-3"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accentSoft text-sm font-bold text-accent">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 font-semibold text-ink">{area.area}</span>
            <span className="text-sm text-muted tabular-nums">
              missed {area.missed} of {area.answered}
            </span>
            <Link
              href={`/tests/custom?area=${encodeURIComponent(area.area)}`}
              className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
            >
              Practice
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

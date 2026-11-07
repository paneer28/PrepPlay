import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { Tag } from "@/components/ds/Tag";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { DeleteAttemptButton } from "@/components/account/tests/DeleteAttemptButton";
import { NavSelect } from "@/components/account/tests/NavSelect";
import { testsHref, type TestsTabState } from "@/components/account/tests/params";
import { formatShortDate } from "@/components/account/tests/ui";
import { ButtonLink } from "@/components/ds/Button";
import type { DateBounds } from "@/lib/date-range";
import { percentOf } from "@/lib/score-scale";
import { formatDuration, type HistoryMode, type HistorySort } from "@/lib/test-results-shared";
import { getHistory, testLabels, type HistoryAttempt, type HistoryEntry } from "@/lib/test-results";

const SORTS: Array<{ value: HistorySort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "score-high", label: "Highest score" },
  { value: "score-low", label: "Lowest score" }
];

const MODES: Array<{ value: HistoryMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "full", label: "Full tests" },
  { value: "custom", label: "Custom practice" }
];

// "2026-11-06" → "Thu, Nov 6, 2026". The day is already in the viewer's zone.
function formatDay(day: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`)
  );
}

function ScoreTag({ correct, total }: { correct: number; total: number }) {
  const percent = percentOf(correct, total);
  return (
    <Tag tone={percent >= 80 ? "correct" : percent < 60 ? "wrong" : "neutral"} className="tabular-nums">
      {percent}%
    </Tag>
  );
}

function attemptTitle(attempt: HistoryAttempt) {
  const labels = testLabels(attempt.test_id, attempt.test_title);
  return attempt.mode === "full" ? `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}` : "Custom practice";
}

export async function HistorySection({ state, bounds, timeZone }: { state: TestsTabState; bounds: DateBounds; timeZone: string }) {
  const result = await getHistory(bounds, state.history, state.history.page, state.set, timeZone);

  // Date sorts show a heading per day.
  const groups: Array<{ day: string; entries: HistoryEntry[] }> = [];
  if (result.ok) {
    for (const entry of result.data.entries) {
      const last = groups[groups.length - 1];
      if (result.data.byDay && last && last.day === entry.day) last.entries.push(entry);
      else groups.push({ day: entry.day, entries: [entry] });
    }
  }

  return (
    <DashboardSection
      title="Every test you've taken"
      description="Full tests and custom sessions get a row each. A day's Infinite sessions are combined into one row; open it to see each session."
    >
      {!result.ok ? (
        <p className="p-5 text-fg sm:p-6">
          {result.reason === "unavailable"
            ? "History isn't set up yet. Run supabase/migrations/2026-11-06-question-notes.sql in the Supabase SQL Editor."
            : "Couldn't load your history right now."}
        </p>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="max-w-full space-y-1.5">
              <p className="text-label font-bold text-fg-muted">Sort</p>
              <SegmentedControl
                label="Sort history"
                size="sm"
                scroll={false}
                value={state.history.sort}
                items={SORTS.map((option) => ({ ...option, href: testsHref(state, { hs: option.value, hp: 1 }) }))}
              />
            </div>
            <div className="max-w-full space-y-1.5">
              <p className="text-label font-bold text-fg-muted">Show</p>
              <SegmentedControl
                label="Show tests"
                size="sm"
                scroll={false}
                value={state.history.mode}
                items={MODES.map((option) => ({ ...option, href: testsHref(state, { hm: option.value, hp: 1 }) }))}
              />
            </div>
            {result.data.clusters.length > 1 ? (
              <div className="w-full min-w-0 sm:w-auto sm:max-w-xs">
                <NavSelect
                  label="Cluster"
                  value={state.history.cluster ?? ""}
                  options={[
                    { value: "", label: "All clusters", href: testsHref(state, { hc: null, hp: 1 }) },
                    ...result.data.clusters.map((cluster) => ({
                      value: cluster,
                      label: cluster,
                      href: testsHref(state, { hc: cluster, hp: 1 })
                    }))
                  ]}
                />
              </div>
            ) : null}
          </div>

          {groups.length === 0 ? (
            <p className="rounded-control bg-surface px-5 py-6 text-fg">No tests match these filters.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <section key={`${group.day}-${group.entries[0].key}`} aria-label={result.data.byDay ? formatDay(group.day) : undefined}>
                  {result.data.byDay ? <h3 className="mb-1 text-label font-extrabold text-fg-muted">{formatDay(group.day)}</h3> : null}
                  <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
                    {group.entries.map((entry) =>
                      entry.kind === "attempt" ? (
                        <li key={entry.key}>
                          <AttemptRow attempt={entry.attempt} timeZone={timeZone} showDate={!result.data.byDay} />
                        </li>
                      ) : (
                        <li key={entry.key}>
                          <InfiniteDayRow entry={entry} timeZone={timeZone} />
                        </li>
                      )
                    )}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small font-semibold text-fg-muted tabular-nums">
              {result.data.attemptCount} {result.data.attemptCount === 1 ? "result" : "results"} on {result.data.dayCount}{" "}
              {result.data.dayCount === 1 ? "day" : "days"} · Page {result.data.page} of {result.data.totalPages}
              {result.data.byDay ? " · 7 days a page" : ""}
            </p>
            <div className="flex gap-2">
              <PageLink href={testsHref(state, { hp: Math.max(1, result.data.page - 1) })} disabled={result.data.page === 1}>
                Previous
              </PageLink>
              <PageLink href={testsHref(state, { hp: Math.min(result.data.totalPages, result.data.page + 1) })} disabled={result.data.page === result.data.totalPages}>
                Next
              </PageLink>
            </div>
          </div>
        </div>
      )}
    </DashboardSection>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: string }) {
  return (
    <ButtonLink
      href={href}
      scroll={false}
      variant="secondary"
      size="sm"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={disabled ? "pointer-events-none" : ""}
    >
      {children}
    </ButtonLink>
  );
}

function AttemptRow({ attempt, timeZone, showDate, nested = false }: { attempt: HistoryAttempt; timeZone: string; showDate: boolean; nested?: boolean }) {
  const title = attemptTitle(attempt);
  const subtitle = attempt.mode === "full" ? attempt.test_title : attempt.filters?.summary;
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(attempt.submitted_at));

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 ${nested ? "px-3" : ""}`}>
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="flex items-center gap-2 font-bold text-fg">
          <span className="truncate">{nested ? `Session at ${time}` : title}</span>
          {!nested && attempt.question_set === "original" ? <Tag tone="brand" className="shrink-0">Practice set</Tag> : null}
        </p>
        <p className="truncate text-label font-semibold text-fg-muted">
          {[showDate ? formatShortDate(attempt.submitted_at, timeZone) : nested ? null : time, nested ? attempt.cluster ?? "Mixed clusters" : subtitle]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="text-small font-bold text-fg tabular-nums">
        {attempt.correct} / {attempt.total}
      </span>
      <ScoreTag correct={attempt.correct} total={attempt.total} />
      <span className="w-20 text-small font-semibold text-fg-muted tabular-nums">{formatDuration(attempt.time_taken_seconds)}</span>
      <span className="ml-auto flex items-center gap-4">
        <Link href={`/account/tests/${attempt.id}`} className="text-small font-bold text-brand-text hover:underline">
          View
        </Link>
        <DeleteAttemptButton attemptId={attempt.id} label={`${title} (${formatShortDate(attempt.submitted_at, timeZone)})`} />
      </span>
    </div>
  );
}

function InfiniteDayRow({ entry, timeZone }: { entry: Extract<HistoryEntry, { kind: "infinite-day" }>; timeZone: string }) {
  const count = entry.sessions.length;
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${entry.day}T00:00:00Z`));

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1.5 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 basis-full items-start gap-2 sm:basis-auto">
          <CaretRightIcon size={14} weight="bold" aria-hidden="true" className="mt-1 shrink-0 text-fg-muted transition-transform group-open:rotate-90" />
          <div className="min-w-0">
            <p className="font-bold text-fg">
              {date} · {count} Infinite {count === 1 ? "session" : "sessions"}
            </p>
            <p className="truncate text-label font-semibold text-fg-muted">{entry.clusters.join(", ")}</p>
          </div>
        </div>
        <span className="text-small font-bold text-fg tabular-nums">
          {entry.correct} / {entry.total}
        </span>
        <ScoreTag correct={entry.correct} total={entry.total} />
        <span className="w-20 text-small font-semibold text-fg-muted tabular-nums">{formatDuration(entry.seconds)}</span>
        <span className="ml-auto text-small font-bold text-brand-text">
          <span className="group-open:hidden">Show sessions</span>
          <span className="hidden group-open:inline">Hide sessions</span>
        </span>
      </summary>
      <ul className="mb-3 divide-y-[1.5px] divide-rule rounded-control bg-surface">
        {entry.sessions.map((session) => (
          <li key={session.id}>
            <AttemptRow attempt={session} timeZone={timeZone} showDate={false} nested />
          </li>
        ))}
      </ul>
    </details>
  );
}

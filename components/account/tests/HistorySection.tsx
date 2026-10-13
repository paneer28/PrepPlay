import Link from "next/link";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { Tag } from "@/components/ds/Tag";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { DeleteAttemptButton } from "@/components/account/tests/DeleteAttemptButton";
import { NavSelect } from "@/components/account/tests/NavSelect";
import { testsHref, type TestsTabState } from "@/components/account/tests/params";
import { formatShortDate, Pager } from "@/components/account/tests/ui";
import type { DateBounds } from "@/lib/date-range";
import { percentOf } from "@/lib/score-scale";
import { DASHBOARD_PAGE_SIZE, formatDuration, type HistoryMode, type HistorySort } from "@/lib/test-results-shared";
import { getHistoryPage, testLabels } from "@/lib/test-results";

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

export async function HistorySection({
  state,
  bounds,
  timeZone
}: {
  state: TestsTabState;
  bounds: DateBounds;
  timeZone: string;
}) {
  let page = state.history.page;
  let result = await getHistoryPage(bounds, state.history, page);
  // Past the end (e.g. after deleting the last row on a page): show the last page.
  if (result.ok && result.data.rows.length === 0 && result.data.total > 0) {
    page = Math.ceil(result.data.total / DASHBOARD_PAGE_SIZE);
    result = await getHistoryPage(bounds, state.history, page);
  }

  return (
    <DashboardSection title="Every test you've taken" description="One row per submitted test or custom session.">
      {!result.ok ? (
        <p className="p-5 text-fg sm:p-6">Couldn&apos;t load your history right now.</p>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <p className="text-label font-bold text-fg-muted">Sort</p>
              <SegmentedControl
                label="Sort history"
                size="sm"
                scroll={false}
                value={state.history.sort}
                items={SORTS.map((option) => ({ ...option, href: testsHref(state, { hs: option.value, hp: 1 }) }))}
              />
            </div>
            <div className="space-y-1.5">
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

          {result.data.rows.length === 0 ? (
            <p className="rounded-control bg-surface px-5 py-6 text-fg">No tests match these filters.</p>
          ) : (
            <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
              {result.data.rows.map((row) => {
                const percent = percentOf(row.correct, row.total);
                const labels = testLabels(row.test_id, row.test_title);
                const title =
                  row.mode === "full" ? `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}` : "Custom practice";
                const subtitle = row.mode === "full" ? row.test_title : row.filters?.summary;

                return (
                  <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate font-bold text-fg">{title}</p>
                      <p className="truncate text-label font-semibold text-fg-muted">
                        {[formatShortDate(row.submitted_at, timeZone), subtitle].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-small font-bold text-fg tabular-nums">
                      {row.correct} / {row.total}
                    </span>
                    <Tag tone={percent >= 80 ? "correct" : percent < 60 ? "wrong" : "neutral"} className="tabular-nums">
                      {percent}%
                    </Tag>
                    <span className="w-20 text-small font-semibold text-fg-muted tabular-nums">{formatDuration(row.time_taken_seconds)}</span>
                    <span className="ml-auto flex items-center gap-4">
                      <Link href={`/account/tests/${row.id}`} className="text-small font-bold text-brand-text hover:underline">
                        View
                      </Link>
                      <DeleteAttemptButton
                        attemptId={row.id}
                        label={`${title} (${formatShortDate(row.submitted_at, timeZone)})`}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <Pager
            page={page}
            pageSize={DASHBOARD_PAGE_SIZE}
            total={result.data.total}
            noun="tests"
            hrefFor={(page) => testsHref(state, { hp: page })}
          />
        </div>
      )}
    </DashboardSection>
  );
}

import Link from "next/link";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { DeleteAttemptButton } from "@/components/account/tests/DeleteAttemptButton";
import { NavSelect } from "@/components/account/tests/NavSelect";
import { testsHref, type TestsTabState } from "@/components/account/tests/params";
import { formatShortDate, Pager, PillLink } from "@/components/account/tests/ui";
import type { DateBounds } from "@/lib/date-range";
import { bandStyle, percentOf } from "@/lib/score-scale";
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
    <DashboardSection eyebrow="History" title="Every test you've taken" description="One row per submitted test or custom session.">
      {!result.ok ? (
        <p className="p-6 text-sm text-muted sm:p-7">Couldn&apos;t load your history right now.</p>
      ) : (
        <div className="space-y-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Sort</p>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((option) => (
                  <PillLink
                    key={option.value}
                    active={state.history.sort === option.value}
                    href={testsHref(state, { hs: option.value, hp: 1 })}
                  >
                    {option.label}
                  </PillLink>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Show</p>
              <div className="inline-flex rounded-full border border-line bg-[#f5f7fb] p-1 text-sm font-semibold">
                {MODES.map((option) => (
                  <Link
                    key={option.value}
                    href={testsHref(state, { hm: option.value, hp: 1 })}
                    scroll={false}
                    aria-current={state.history.mode === option.value ? "true" : undefined}
                    className={`rounded-full px-3.5 py-1.5 transition ${
                      state.history.mode === option.value ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
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
            <p className="rounded-[1.5rem] border border-line bg-[#f8fbff] px-5 py-6 text-sm text-muted">
              No tests match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-line/80 overflow-hidden rounded-[1.2rem] border border-line bg-white">
              {result.data.rows.map((row) => {
                const percent = percentOf(row.correct, row.total);
                const labels = testLabels(row.test_id, row.test_title);
                const title =
                  row.mode === "full" ? `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}` : "Custom practice";
                const subtitle = row.mode === "full" ? row.test_title : row.filters?.summary;

                return (
                  <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3">
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate font-semibold text-ink">{title}</p>
                      <p className="truncate text-xs text-muted">
                        {[formatShortDate(row.submitted_at, timeZone), subtitle].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular-nums">
                      {row.correct} / {row.total}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${bandStyle(percent).cell}`}>
                      {percent}%
                    </span>
                    <span className="w-20 text-sm text-muted tabular-nums">{formatDuration(row.time_taken_seconds)}</span>
                    <span className="ml-auto flex items-center gap-4">
                      <Link href={`/account/tests/${row.id}`} className="text-sm font-semibold text-accent hover:underline">
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

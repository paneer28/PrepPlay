import Link from "next/link";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { MissedFilters, PracticeMissedButton } from "@/components/account/tests/MissedControls";
import { testsHref, type TestsTabState } from "@/components/account/tests/params";
import { formatShortDate, Pager } from "@/components/account/tests/ui";
import type { DateBounds } from "@/lib/date-range";
import { DASHBOARD_PAGE_SIZE } from "@/lib/test-results-shared";
import { getMissedPage, type DashboardOverview } from "@/lib/test-results";

export async function MissedSection({
  state,
  bounds,
  tags,
  timeZone
}: {
  state: TestsTabState;
  bounds: DateBounds;
  tags: DashboardOverview["tags"];
  timeZone: string;
}) {
  const filters = { area: state.missed.area, test: state.missed.test, note: state.missed.note };
  let page = state.missed.page;
  let result = await getMissedPage(bounds, filters, page);
  // Past the end (e.g. after a result was deleted): show the last page.
  if (result.ok && result.data.rows.length === 0 && result.data.total > 0) {
    page = Math.ceil(result.data.total / DASHBOARD_PAGE_SIZE);
    result = await getMissedPage(bounds, filters, page);
  }
  const reset = { mp: 1 };

  return (
    <DashboardSection
      eyebrow="Missed questions"
      title="Every question you got wrong"
      description="Add notes on the review screen to track why you missed them. Unanswered questions count as missed."
    >
      {!result.ok ? (
        <p className="p-6 text-sm text-muted sm:p-7">Couldn&apos;t load your missed questions right now.</p>
      ) : (
        <div className="space-y-5 p-6 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Your most common mistakes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...tags]
                .sort((left, right) => right.count - left.count)
                .map((tag) => (
                  <span
                    key={tag.tag}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      tag.count > 0 ? "border-line bg-white text-ink" : "border-line/70 bg-[#f8fbff] text-muted"
                    }`}
                  >
                    {tag.tag}: <span className="font-bold tabular-nums">{tag.count}</span>
                  </span>
                ))}
            </div>
          </div>

          <MissedFilters
            areas={result.data.areas}
            tests={result.data.tests}
            value={filters}
            hrefs={{
              area: Object.fromEntries(["", ...result.data.areas].map((area) => [area, testsHref(state, { ...reset, ma: area || null })])),
              test: Object.fromEntries(
                ["", ...result.data.tests.map((test) => test.id)].map((id) => [id, testsHref(state, { ...reset, mt: id || null })])
              ),
              note: Object.fromEntries(["any", "with", "without"].map((note) => [note, testsHref(state, { ...reset, mn: note })]))
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {result.data.total} missed {result.data.total === 1 ? "question" : "questions"} match these filters
            </p>
            <PracticeMissedButton range={state.range} filters={filters} count={result.data.total} />
          </div>

          {result.data.rows.length === 0 ? (
            <p className="rounded-[1.5rem] border border-line bg-[#f8fbff] px-5 py-6 text-sm text-muted">
              No missed questions match these filters.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.data.rows.map((row) => (
                <li
                  key={`${row.attempt_id}-${row.position}`}
                  className="rounded-[1.2rem] border border-line bg-white px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink" title={row.questionText}>
                        {row.questionText}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {row.sourceLabel} · Q{row.source_number} · {row.instructional_area} ·{" "}
                        {formatShortDate(row.submitted_at, timeZone)}
                        {row.unanswered ? " · Unanswered" : ""}
                      </p>
                      {row.note ? (
                        <p className="mt-1.5 truncate text-sm text-ink">
                          <span className="font-semibold text-accent">Note:</span> {row.note}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/account/tests/${row.attempt_id}#q-${row.position}`}
                      className="shrink-0 self-start rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pager
            page={page}
            pageSize={DASHBOARD_PAGE_SIZE}
            total={result.data.total}
            noun="missed questions"
            hrefFor={(page) => testsHref(state, { mp: page })}
          />
        </div>
      )}
    </DashboardSection>
  );
}

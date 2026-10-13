import Link from "next/link";
import { Tag } from "@/components/ds/Tag";
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
      title="Every question you got wrong"
      description="Add notes on the review screen to track why you missed them. Unanswered questions count as missed."
    >
      {!result.ok ? (
        <p className="p-5 text-fg sm:p-6">Couldn&apos;t load your missed questions right now.</p>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-small font-extrabold text-fg">Your most common mistakes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...tags]
                .sort((left, right) => right.count - left.count)
                .map((tag) => (
                  <Tag key={tag.tag} tone={tag.count > 0 ? "wrong" : "neutral"}>
                    {tag.tag}: <span className="tabular-nums">{tag.count}</span>
                  </Tag>
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
            <p className="text-small font-semibold text-fg-muted">
              {result.data.total} missed {result.data.total === 1 ? "question" : "questions"} match these filters
            </p>
            <PracticeMissedButton range={state.range} filters={filters} count={result.data.total} />
          </div>

          {result.data.rows.length === 0 ? (
            <p className="rounded-control bg-surface px-5 py-6 text-fg">No missed questions match these filters.</p>
          ) : (
            <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
              {result.data.rows.map((row) => (
                <li key={`${row.attempt_id}-${row.position}`} className="py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-fg" title={row.questionText}>
                        {row.questionText}
                      </p>
                      <p className="mt-0.5 text-label font-semibold text-fg-muted">
                        {row.sourceLabel} · Q{row.source_number} · {row.instructional_area} ·{" "}
                        {formatShortDate(row.submitted_at, timeZone)}
                        {row.unanswered ? " · Unanswered" : ""}
                      </p>
                      {row.note ? (
                        <p className="mt-1 truncate text-small text-fg">
                          <span className="font-extrabold text-brand-text">Note:</span> {row.note}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/account/tests/${row.attempt_id}#q-${row.position}`}
                      className="shrink-0 self-start text-small font-bold text-brand-text hover:underline"
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

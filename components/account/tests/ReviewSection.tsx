import Link from "next/link";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { reviewHref, testsHref, type TestsTabState } from "@/components/account/tests/params";
import { MissedFilters, PracticeListButton } from "@/components/account/tests/ReviewControls";
import { UnflagButton } from "@/components/account/tests/UnflagButton";
import { formatShortDate, Pager } from "@/components/account/tests/ui";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { Tag } from "@/components/ds/Tag";
import { filterReviewItems, reviewFilterOptions, reviewItemsFor, type ReviewData } from "@/lib/review-lists";
import { DASHBOARD_PAGE_SIZE, REVIEW_PAGE_SIZE, type ReviewList } from "@/lib/test-results-shared";
import { testLabels, type Loaded } from "@/lib/test-results";

// "Review your questions": the Got wrong and Flagged lists, with the same
// filters on both. Each row opens the review page for the list at that question.
export function ReviewSection({ state, result, timeZone }: { state: TestsTabState; result: Loaded<ReviewData>; timeZone: string }) {
  const list = state.review.list;

  if (!result.ok) {
    return (
      <DashboardSection title="Review your questions">
        <p className="p-5 text-fg sm:p-6">
          {result.reason === "unavailable"
            ? "The review lists aren't set up yet. Run supabase/migrations/2026-11-06-question-notes.sql in the Supabase SQL Editor."
            : "Couldn't load your questions right now."}
        </p>
      </DashboardSection>
    );
  }

  const data = result.data;
  const filters = { area: state.review.area, test: state.review.test, note: state.review.note };
  const all = reviewItemsFor(data, list);
  const items = filterReviewItems(all, filters);
  const options = reviewFilterOptions(all);
  // Keep a chosen filter selectable even when this list has no match for it.
  if (filters.area && !options.areas.includes(filters.area)) options.areas.unshift(filters.area);
  if (filters.test && !options.tests.some((test) => test.id === filters.test)) {
    const labels = testLabels(filters.test, filters.test);
    options.tests.unshift({ id: filters.test, label: `${labels.cluster ? `${labels.cluster} ` : ""}${labels.short}`, year: 0 });
  }

  const totalPages = Math.max(1, Math.ceil(items.length / DASHBOARD_PAGE_SIZE));
  const page = Math.min(state.review.page, totalPages);
  const offset = (page - 1) * DASHBOARD_PAGE_SIZE;
  const rows = items.slice(offset, offset + DASHBOARD_PAGE_SIZE);
  const reset = { rp: 1 };
  const lists: Array<{ value: ReviewList; label: string }> = [
    { value: "missed", label: `Got wrong (${data.missed.length})` },
    { value: "flagged", label: `Flagged (${data.flagged.length})` }
  ];

  return (
    <DashboardSection
      title="Review your questions"
      description="Unanswered questions count as wrong. A question missed more than once shows up once. Notes are shared between both lists."
    >
      <div className="space-y-5 p-5 sm:p-6">
        <SegmentedControl<ReviewList>
          label="Which questions"
          value={list}
          scroll={false}
          items={lists.map((option) => ({ ...option, href: testsHref(state, { rl: option.value, rp: 1 }) }))}
        />

        {list === "flagged" && !data.flagsAvailable ? (
          <p className="rounded-control bg-surface px-5 py-6 text-fg">Flagged questions aren&apos;t set up yet.</p>
        ) : (
          <>
            <MissedFilters
              areas={options.areas}
              tests={options.tests}
              value={filters}
              hrefs={{
                area: Object.fromEntries(["", ...options.areas].map((area) => [area, testsHref(state, { ...reset, ma: area || null })])),
                test: Object.fromEntries(
                  ["", ...options.tests.map((test) => test.id)].map((id) => [id, testsHref(state, { ...reset, mt: id || null })])
                ),
                note: Object.fromEntries(["any", "with", "without"].map((note) => [note, testsHref(state, { ...reset, mn: note })]))
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-small font-semibold text-fg-muted">
                {items.length} {items.length === 1 ? "question matches" : "questions match"}
              </p>
              <PracticeListButton list={list} range={state.range} filters={filters} count={items.length} set={state.set} />
            </div>

            {rows.length === 0 ? (
              <p className="rounded-control bg-surface px-5 py-6 text-fg">
                {all.length === 0
                  ? list === "flagged"
                    ? "Nothing flagged yet. Flag a question while you practice and it'll show up here."
                    : "No wrong answers here yet."
                  : "No questions match these filters."}
              </p>
            ) : (
              <ul className="divide-y-[1.5px] divide-rule border-y-[1.5px] border-rule">
                {rows.map((item, index) => {
                  const position = offset + index;
                  const href = reviewHref(state, { page: Math.floor(position / REVIEW_PAGE_SIZE) + 1, anchor: item.anchor });
                  const date = list === "flagged" ? item.flaggedAt : item.lastMissed;
                  return (
                    <li key={item.ref} className="py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-fg" title={item.questionText}>
                            {item.questionText}
                          </p>
                          <p className="mt-0.5 text-label font-semibold text-fg-muted">
                            {item.sourceLabel} · Q{item.number} · {item.area}
                            {date ? ` · ${list === "flagged" ? "Flagged" : "Missed"} ${formatShortDate(date, timeZone)}` : ""}
                            {list === "missed" && item.unanswered ? " · Unanswered" : ""}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden">
                            {item.missed > 1 ? <Tag tone="wrong">Missed {item.missed}×</Tag> : null}
                            {list === "missed" && item.flaggedAt ? <Tag tone="brand">Also flagged</Tag> : null}
                            {list === "flagged" && item.missed > 0 ? <Tag tone="wrong">Also wrong</Tag> : null}
                            {item.note ? <Tag tone="correct">Has a note</Tag> : null}
                          </div>
                          {item.note ? (
                            <p className="mt-1 truncate text-small text-fg">
                              <span className="font-extrabold text-brand-text">Note:</span> {item.note}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-4 self-start">
                          {list === "flagged" ? <UnflagButton refs={item.flagRefs} /> : null}
                          <Link href={href} className="text-small font-bold text-brand-text hover:underline">
                            Review
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <Pager
              page={page}
              pageSize={DASHBOARD_PAGE_SIZE}
              total={items.length}
              noun="questions"
              hrefFor={(target) => testsHref(state, { rp: target })}
            />
          </>
        )}
      </div>
    </DashboardSection>
  );
}

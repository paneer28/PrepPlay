import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseTestsParams, reviewHref, testsHref, type TestsTabParams } from "@/components/account/tests/params";
import { UnflagButton } from "@/components/account/tests/UnflagButton";
import { Pager } from "@/components/account/tests/ui";
import { Illustration } from "@/components/ds/Illustration";
import { Tag } from "@/components/ds/Tag";
import { NoteEditorProvider } from "@/components/review/NoteEditor";
import { ReviewCard } from "@/components/review/ReviewCard";
import { getViewer } from "@/lib/auth";
import { normalizeTimezone, rangeBounds, TIME_RANGE_LABELS, TIMEZONE_COOKIE } from "@/lib/date-range";
import { filterReviewItems, getReviewData, reviewItemsFor } from "@/lib/review-lists";
import { DASHBOARD_SET_LABELS, REVIEW_PAGE_SIZE } from "@/lib/test-results-shared";

export const metadata: Metadata = {
  title: "Review questions | PrepPlay",
  robots: { index: false }
};

type ReviewPageProps = { searchParams?: Promise<TestsTabParams & { page?: string }> };

// Every question in one review list (Got wrong or Flagged), with the
// dashboard's filters, as one scroll.
export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?mode=login&next=/account?tab=tests");

  const params = (await searchParams) ?? {};
  const state = parseTestsParams(params);
  const list = state.review.list;
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const bounds = rangeBounds(state.range, timeZone);
  const result = await getReviewData(bounds.from, bounds.to, state.set);
  const backHref = testsHref(state, {});

  const title = list === "flagged" ? "Questions you flagged" : "Questions you got wrong";
  const scope = [TIME_RANGE_LABELS[state.range], state.set === "all" ? "All questions" : DASHBOARD_SET_LABELS[state.set]]
    .concat([state.review.area, state.review.test ? "One test" : null, state.review.note === "with" ? "Has a note" : state.review.note === "without" ? "No note" : null].filter((value): value is string => Boolean(value)))
    .join(" · ");

  if (!result.ok) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Illustration kind="empty" size={120} />
        <h1 className="mt-5 font-display text-h3 font-extrabold text-fg">Couldn&apos;t load these questions</h1>
        <p className="mt-2 max-w-md text-fg">
          {result.reason === "unavailable"
            ? "The review lists aren't set up yet. Run supabase/migrations/2026-11-06-question-notes.sql in the Supabase SQL Editor."
            : "Try again in a moment."}
        </p>
      </div>
    );
  }

  const items = filterReviewItems(reviewItemsFor(result.data, list), state.review);
  const totalPages = Math.max(1, Math.ceil(items.length / REVIEW_PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1), totalPages);
  const shown = items.slice((page - 1) * REVIEW_PAGE_SIZE, page * REVIEW_PAGE_SIZE);
  const pageHref = (target: number) => reviewHref(state, { page: target });
  const notesOn = result.data.notesAvailable;

  return (
    <div className="mx-auto max-w-[880px] space-y-8 pb-10">
      <header className="space-y-4">
        <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline">
          <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
          Tests dashboard
        </Link>
        <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">{title}</h1>
        <p className="text-small font-semibold text-fg-muted">
          {items.length} {items.length === 1 ? "question" : "questions"} · {scope}
        </p>
        <p className="max-w-2xl text-fg">
          Try each one before you open its explanation.
          {notesOn ? <span className="hidden lg:inline"> Use the tab on a card&apos;s right edge to write a note from memory.</span> : null}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-card bg-surface px-5 py-6 text-fg">No questions match these filters.</p>
      ) : (
        <NoteEditorProvider>
          <div className="space-y-5">
            {shown.map((item, index) => {
              const label = `${(page - 1) * REVIEW_PAGE_SIZE + index + 1}. ${item.sourceLabel} · Q${item.number}`;
              if (!item.question) {
                return (
                  <article key={item.ref} id={item.anchor} className="card scroll-mt-28 text-fg">
                    <p className="text-label font-bold text-fg-muted">{label}</p>
                    <p className="mt-2">{item.questionText}</p>
                  </article>
                );
              }
              const graded = item.missed > 0;
              return (
                <ReviewCard
                  key={item.ref}
                  id={item.anchor}
                  label={label}
                  question={item.question}
                  chosen={graded ? item.lastAnswer : null}
                  graded={graded}
                  note={notesOn ? { ref: item.ref, initial: item.note } : null}
                  tags={
                    <>
                      {item.missed > 1 ? <Tag tone="wrong">Missed {item.missed}×</Tag> : null}
                      {list === "missed" && item.flaggedAt ? <Tag tone="brand">Also flagged</Tag> : null}
                      {list === "flagged" ? <Tag tone="brand">Flagged</Tag> : null}
                    </>
                  }
                >
                  {list === "flagged" ? <UnflagButton refs={item.flagRefs} /> : null}
                </ReviewCard>
              );
            })}
          </div>
        </NoteEditorProvider>
      )}

      {totalPages > 1 ? (
        <Pager page={page} pageSize={REVIEW_PAGE_SIZE} total={items.length} noun="questions" hrefFor={pageHref} scroll />
      ) : null}
    </div>
  );
}

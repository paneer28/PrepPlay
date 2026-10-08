import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MissedNoteField } from "@/components/MissedNoteField";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { DeleteAttemptButton } from "@/components/account/tests/DeleteAttemptButton";
import { formatShortDate } from "@/components/account/tests/ui";
import { getViewer } from "@/lib/auth";
import { normalizeTimezone, TIMEZONE_COOKIE } from "@/lib/date-range";
import { bandStyle, percentOf } from "@/lib/score-scale";
import { formatDuration } from "@/lib/test-results-shared";
import { getAttemptDetail, testLabels } from "@/lib/test-results";

export const metadata: Metadata = {
  title: "Test attempt | PrepPlay",
  robots: { index: false }
};

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ area?: string; only?: string }>;
};

export default async function AttemptPage({ params, searchParams }: AttemptPageProps) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const { attemptId } = await params;
  const { area, only } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) notFound();

  const result = await getAttemptDetail(attemptId);
  if (!result.ok) {
    return (
      <div className="pb-10 pt-8">
        <div className="surface px-6 py-12 text-center">
          <h1 className="text-xl font-bold tracking-[-0.03em] text-ink">Couldn&apos;t load this attempt</h1>
          <p className="mt-2 text-sm text-muted">Try again in a moment.</p>
        </div>
      </div>
    );
  }
  if (!result.data) notFound();

  const { attempt, items } = result.data;
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const percent = percentOf(attempt.correct, attempt.total);
  const labels = testLabels(attempt.test_id, attempt.test_title);
  const title = attempt.mode === "full" ? (attempt.test_title ?? "Full test") : "Custom practice";
  const subtitle =
    attempt.mode === "full"
      ? [attempt.cluster, labels.short].filter(Boolean).join(" · ")
      : attempt.filters?.summary ?? "Custom practice session";

  const byArea = new Map<string, { total: number; correct: number }>();
  for (const item of items) {
    const entry = byArea.get(item.instructional_area) ?? { total: 0, correct: 0 };
    entry.total += 1;
    entry.correct += item.is_correct ? 1 : 0;
    byArea.set(item.instructional_area, entry);
  }
  const areas = Array.from(byArea, ([name, value]) => ({ name, ...value })).sort(
    (left, right) => left.correct / left.total - right.correct / right.total || left.name.localeCompare(right.name)
  );

  const activeArea = area && byArea.has(area) ? area : null;
  const missedOnly = only === "missed";
  const reviewItems = items.filter(
    (item) => (!activeArea || item.instructional_area === activeArea) && (!missedOnly || !item.is_correct)
  );
  const base = `/account/tests/${attempt.id}`;
  const hrefWith = (changes: { area?: string | null; only?: string | null }) => {
    const search = new URLSearchParams();
    const nextArea = changes.area === undefined ? activeArea : changes.area;
    const nextOnly = changes.only === undefined ? (missedOnly ? "missed" : null) : changes.only;
    if (nextArea) search.set("area", nextArea);
    if (nextOnly) search.set("only", nextOnly);
    const query = search.toString();
    return query ? `${base}?${query}` : base;
  };

  return (
    <div className="space-y-6 pb-10 pt-8">
      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line/80 bg-[linear-gradient(135deg,#f1f6ff,#f9fbff)] p-7 sm:p-9">
          <div className="min-w-0">
            <Link href="/account?tab=tests" className="text-sm font-semibold text-muted transition hover:text-ink">
              ← Tests dashboard
            </Link>
            <p className="eyebrow mt-5">{attempt.mode === "full" ? "Full test" : "Custom practice"}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-ink sm:text-4xl">{title}</h1>
            <p className="mt-2 text-base text-muted">{subtitle}</p>
            <p className="mt-1 text-sm text-muted">
              {formatShortDate(attempt.submitted_at, timeZone)} · Time taken {formatDuration(attempt.time_taken_seconds)}
              {attempt.timed_out ? " · Time ran out" : ""}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-line bg-white px-6 py-5 shadow-card">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Score</p>
            <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">
              {attempt.correct} / {attempt.total}
            </p>
            <p className={`text-sm font-semibold ${bandStyle(percent).text}`}>{percent}%</p>
            <div className="mt-4 border-t border-line/80 pt-3">
              <DeleteAttemptButton
                attemptId={attempt.id}
                label={`${attempt.mode === "full" ? labels.short : "This custom session"} (${formatShortDate(attempt.submitted_at, timeZone)})`}
                redirectTo="/account?tab=tests"
              />
            </div>
          </div>
        </div>

        <div className="space-y-7 p-7 sm:p-9">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">By instructional area</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((entry) => {
                const areaPercent = percentOf(entry.correct, entry.total);
                const isActive = activeArea === entry.name;
                return (
                  <Link
                    key={entry.name}
                    href={hrefWith({ area: isActive ? null : entry.name })}
                    scroll={false}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex items-center justify-between gap-3 rounded-[1rem] border px-3.5 py-2.5 transition hover:brightness-95 ${bandStyle(areaPercent).cell} ${
                      isActive ? "ring-2 ring-accent ring-offset-1" : ""
                    }`}
                  >
                    <span className="min-w-0 truncate text-sm font-semibold">{entry.name}</span>
                    <span className="shrink-0 text-xs font-bold tabular-nums">
                      {entry.correct}/{entry.total} · {areaPercent}%
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">Question by question</h2>
            <p className="mt-1 text-sm text-muted">Click a square to jump to that question.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {items.map((item) => {
                const inView = reviewItems.includes(item);
                return (
                  <a
                    key={item.position}
                    href={inView ? `#q-${item.position}` : `${base}#q-${item.position}`}
                    aria-label={`Question ${item.position}, ${item.is_correct ? "correct" : item.unanswered ? "unanswered" : "incorrect"}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-[0.65rem] font-semibold tabular-nums transition hover:brightness-95 ${
                      item.is_correct
                        ? "border-green-200 bg-green-50 text-green-700"
                        : item.unanswered
                          ? "border-red-200 bg-white text-red-700"
                          : "border-red-200 bg-red-50 text-red-700"
                    } ${activeArea && item.instructional_area !== activeArea ? "opacity-40" : ""}`}
                  >
                    {item.position}
                  </a>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-green-200 bg-green-50" /> Correct
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-red-200 bg-red-50" /> Incorrect
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-red-200 bg-white" /> Unanswered
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 p-7 sm:px-9">
          <div>
            <p className="eyebrow">Answer review</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">
              {activeArea ? activeArea : "All questions"}
            </h2>
            {activeArea ? (
              <Link href={hrefWith({ area: null })} scroll={false} className="mt-1 inline-flex text-sm font-semibold text-accent hover:underline">
                Show every area
              </Link>
            ) : null}
          </div>
          <div className="inline-flex rounded-full border border-line bg-[#f5f7fb] p-1 text-sm font-semibold">
            {[
              { label: "All questions", value: null },
              { label: "Incorrect only", value: "missed" }
            ].map((option) => {
              const active = (option.value === "missed") === missedOnly;
              return (
                <Link
                  key={option.label}
                  href={hrefWith({ only: option.value })}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-full px-4 py-2 transition ${active ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"}`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-5 p-7 sm:p-9">
          {reviewItems.length === 0 ? (
            <p className="rounded-[1.4rem] border border-green-200 bg-green-50 px-5 py-4 text-base font-semibold text-green-800">
              No incorrect answers here. Nice work!
            </p>
          ) : null}
          {reviewItems.map((item) =>
            item.question ? (
              <QuestionReviewCard
                key={item.position}
                id={`q-${item.position}`}
                label={`Question ${item.position}`}
                // Custom sessions show where each question came from; full tests don't need to.
                question={attempt.mode === "full" ? { ...item.question, origin: undefined } : item.question}
                chosen={item.user_answer}
              >
                {!item.is_correct ? (
                  <MissedNoteField attemptId={attempt.id} position={item.position} initialNote={item.note ?? ""} />
                ) : null}
              </QuestionReviewCard>
            ) : (
              <article key={item.position} id={`q-${item.position}`} className="rounded-[1.6rem] border border-line bg-white p-6 text-sm text-muted">
                Question {item.position} is no longer available in the test files.
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}

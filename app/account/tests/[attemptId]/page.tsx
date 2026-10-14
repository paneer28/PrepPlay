import { ArrowLeftIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MissedNoteField } from "@/components/MissedNoteField";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { DeleteAttemptButton } from "@/components/account/tests/DeleteAttemptButton";
import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { Tag } from "@/components/ds/Tag";
import { formatShortDate } from "@/components/account/tests/ui";
import { getViewer } from "@/lib/auth";
import { normalizeTimezone, TIMEZONE_COOKIE } from "@/lib/date-range";
import { percentOf, scoreTint } from "@/lib/score-scale";
import { formatDuration } from "@/lib/test-results-shared";
import { getAttemptDetail, testLabels } from "@/lib/test-results";
import { originalSetLabel } from "@/lib/question-sets";

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
      <div className="flex flex-col items-center py-16 text-center">
        <Illustration kind="empty" size={120} />
        <h1 className="mt-5 font-display text-h3 font-extrabold text-fg">Couldn&apos;t load this attempt</h1>
        <p className="mt-2 text-fg">Try again in a moment.</p>
      </div>
    );
  }
  if (!result.data) notFound();

  const { attempt, items, locked } = result.data;
  const practiceSet = attempt.question_set === "original";
  const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const percent = percentOf(attempt.correct, attempt.total);
  const labels = testLabels(attempt.test_id, attempt.test_title);
  const title =
    attempt.mode === "full"
      ? practiceSet && attempt.test_title
        ? originalSetLabel({ title: attempt.test_title, cluster: attempt.cluster ?? "" })
        : (attempt.test_title ?? "Full test")
      : "Custom practice";
  const subtitle =
    attempt.mode === "full"
      ? practiceSet
        ? "PrepPlay practice questions"
        : [attempt.cluster, labels.short].filter(Boolean).join(" · ")
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
    <div className="mx-auto max-w-[880px] space-y-12 pb-10">
      <header className="space-y-6">
        <Link href="/account?tab=tests" className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-brand-text hover:underline">
          <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
          Tests dashboard
        </Link>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Tag tone="brand">{practiceSet ? "Practice set" : attempt.mode === "full" ? "Full test" : "Custom practice"}</Tag>
            {attempt.timed_out ? <Tag tone="wrong">Time ran out</Tag> : null}
          </div>
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">{title}</h1>
          <p className="text-fg">{subtitle}</p>
          <p className="text-small font-semibold text-fg-muted">
            {formatShortDate(attempt.submitted_at, timeZone)} · Time taken {formatDuration(attempt.time_taken_seconds)}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <StatTile value={`${percent}%`} label={`${attempt.correct} of ${attempt.total} correct`} />
          <DeleteAttemptButton
            attemptId={attempt.id}
            variant="button"
            label={`${attempt.mode === "full" ? labels.short : "This custom session"} (${formatShortDate(attempt.submitted_at, timeZone)})`}
            redirectTo="/account?tab=tests"
          />
        </div>
      </header>

      {locked ? (
        <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-fg">
            <LockSimpleIcon size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-brand-text" />
            <span>Enter the access code to review the DECA exam questions in this result. Your score and areas still show.</span>
          </p>
          <ButtonLink href={`/tests-access?next=${encodeURIComponent("/exams")}`} className="shrink-0">
            Enter access code
          </ButtonLink>
        </div>
      ) : null}

      <section aria-labelledby="areas-title" className="space-y-3">
        <h2 id="areas-title" className="font-display text-h3 font-extrabold text-fg">
          By instructional area
        </h2>
        <p className="text-small text-fg-muted">Choose an area to review only its questions.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((entry) => {
            const areaPercent = percentOf(entry.correct, entry.total);
            const isActive = activeArea === entry.name;
            return (
              <Link
                key={entry.name}
                href={hrefWith({ area: isActive ? null : entry.name })}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                style={{ background: scoreTint(areaPercent) }}
                className={`flex items-center justify-between gap-3 rounded-control border-[1.5px] px-3.5 py-2.5 text-fg transition hover:brightness-95 ${
                  isActive ? "border-brand outline outline-2 outline-offset-1 outline-brand" : "border-transparent"
                }`}
              >
                <span className="min-w-0 truncate text-small font-bold">{entry.name}</span>
                <span className="shrink-0 text-label font-extrabold tabular-nums">
                  {entry.correct}/{entry.total} · {areaPercent}%
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="grid-title" className="space-y-3">
        <h2 id="grid-title" className="font-display text-h3 font-extrabold text-fg">
          Question by question
        </h2>
        <p className="text-small text-fg-muted">Choose a square to jump to that question.</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const inView = reviewItems.includes(item);
            return (
              <a
                key={item.position}
                href={inView ? `#q-${item.position}` : `${base}#q-${item.position}`}
                aria-label={`Question ${item.position}, ${item.is_correct ? "correct" : item.unanswered ? "unanswered" : "incorrect"}`}
                className={`grid h-9 w-9 place-items-center rounded-lg border-[1.5px] text-label font-extrabold tabular-nums transition hover:brightness-95 ${
                  item.is_correct
                    ? "border-correct-fill bg-correct-fill text-white"
                    : item.unanswered
                      ? "border-wrong bg-page text-wrong-text"
                      : "border-wrong-fill bg-wrong-fill text-white"
                } ${activeArea && item.instructional_area !== activeArea ? "opacity-30" : ""}`}
              >
                {item.position}
              </a>
            );
          })}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-label font-bold text-fg-muted">
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded bg-correct-fill" /> Correct
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded bg-wrong-fill" /> Incorrect
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded border-[1.5px] border-wrong bg-page" /> Unanswered
          </li>
        </ul>
      </section>

      <section aria-labelledby="review-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="review-title" className="font-display text-h2 font-extrabold text-fg">
              {activeArea ? activeArea : "All questions"}
            </h2>
            {activeArea ? (
              <Link href={hrefWith({ area: null })} scroll={false} className="mt-1 inline-flex text-small font-bold text-brand-text hover:underline">
                Show every area
              </Link>
            ) : null}
          </div>
          <SegmentedControl
            label="Which questions to show"
            scroll={false}
            value={missedOnly ? "missed" : "all"}
            items={[
              { value: "all", label: "All questions", href: hrefWith({ only: null }) },
              { value: "missed", label: "Incorrect only", href: hrefWith({ only: "missed" }) }
            ]}
          />
        </div>

        {reviewItems.length === 0 ? (
          <p className="flex items-center gap-2 rounded-card bg-correct-tint px-5 py-4 font-bold text-correct-text">
            <CheckCircleIcon size={22} weight="fill" aria-hidden="true" />
            No incorrect answers here. Nice work!
          </p>
        ) : null}
        <div className="space-y-5">
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
              <article key={item.position} id={`q-${item.position}`} className="card text-fg">
                {locked
                  ? `Question ${item.position} is a DECA exam question. Enter the access code to review it.`
                  : `Question ${item.position} is no longer available in the test files.`}
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}

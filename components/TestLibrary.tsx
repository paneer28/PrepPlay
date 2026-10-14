"use client";

import { ArrowRightIcon, LockSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { ClusterIcon } from "@/components/ds/ClusterIcon";
import { FieldLabel, Select } from "@/components/ds/Field";
import { Illustration } from "@/components/ds/Illustration";
import { ProgressRing } from "@/components/ds/ProgressRing";
import { Tag } from "@/components/ds/Tag";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { loadTestStatus, type TestStatus } from "@/lib/test-progress";
import type { PracticeTestSummary } from "@/types";

// Competition stage order, not alphabetical.
const EVENT_ORDER = ["District", "State", "ICDC"];

// Saved progress lives in localStorage. Read it as an external store so the
// server render (no storage) and the browser render stay consistent.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useTestStatuses(tests: PracticeTestSummary[]) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(tests.map((test) => loadTestStatus(test.id, test.questionCount))),
    () => "[]"
  );

  return useMemo(() => {
    const statuses = JSON.parse(snapshot) as (TestStatus | null)[];
    return new Map(tests.map((test, index) => [test.id, statuses[index] ?? null]));
  }, [snapshot, tests]);
}

// `locked`: no access code yet. The exams are listed greyed out with one
// "Enter access code" button, plus a way to the free original questions.
export function TestLibrary({
  tests,
  locked = false,
  freeQuestions = 0
}: {
  tests: PracticeTestSummary[];
  locked?: boolean;
  freeQuestions?: number;
}) {
  const [cluster, setCluster] = useState("");
  const [year, setYear] = useState("");
  const [event, setEvent] = useState("");
  const statuses = useTestStatuses(tests);

  const clusters = useMemo(() => Array.from(new Set(tests.map((test) => test.cluster))).sort(), [tests]);
  const years = useMemo(
    () =>
      Array.from(new Set(tests.map((test) => test.year).filter((value): value is number => value !== null))).sort(
        (a, b) => b - a
      ),
    [tests]
  );
  const events = useMemo(() => {
    const rank = (value: string) => (EVENT_ORDER.includes(value) ? EVENT_ORDER.indexOf(value) : EVENT_ORDER.length);
    return Array.from(new Set(tests.map((test) => test.event).filter((value): value is string => Boolean(value)))).sort(
      (a, b) => rank(a) - rank(b) || a.localeCompare(b)
    );
  }, [tests]);

  const visibleTests = useMemo(
    () =>
      tests
        .filter(
          (test) =>
            (!cluster || test.cluster === cluster) &&
            (!year || String(test.year) === year) &&
            (!event || test.event === event)
        )
        .sort(
          (a, b) =>
            (b.year ?? 0) - (a.year ?? 0) || a.cluster.localeCompare(b.cluster) || a.title.localeCompare(b.title)
        ),
    [cluster, event, tests, year]
  );

  const hasFilters = Boolean(cluster || year || event);

  const clearFilters = () => {
    setCluster("");
    setYear("");
    setEvent("");
  };

  return (
    <div className="space-y-10">
      <TestModeSwitch active="full" />

      <header className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Take a full cluster exam</h1>
          <p className="text-fg">
            Answers and explanations stay hidden until you submit. Then you get a breakdown by instructional area.
          </p>
        </div>

        {locked ? (
          <div className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-brand-tint text-brand-text">
                <LockSimpleIcon size={24} weight="bold" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-h4 font-extrabold text-fg">The real DECA exams need an access code</p>
                <p className="mt-1 text-small text-fg-muted">
                  No code?{" "}
                  <Link href="/practice-questions" className="font-bold text-brand-text hover:underline">
                    Practice with {freeQuestions} free questions.
                  </Link>
                </p>
              </div>
            </div>
            <ButtonLink href="/tests-access?next=/tests" className="shrink-0">
              Enter access code
            </ButtonLink>
          </div>
        ) : null}

        {clusters.length > 1 || years.length > 1 || events.length > 1 ? (
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            {clusters.length > 1 ? (
              <FieldLabel label="Cluster" className="sm:w-72">
                <Select value={cluster} onChange={(changeEvent) => setCluster(changeEvent.target.value)}>
                  <option value="">All clusters</option>
                  {clusters.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </FieldLabel>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:flex">
              {years.length > 1 ? (
                <FieldLabel label="Year" className="sm:w-36">
                  <Select value={year} onChange={(changeEvent) => setYear(changeEvent.target.value)}>
                    <option value="">All years</option>
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FieldLabel>
              ) : null}
              {events.length > 1 ? (
                <FieldLabel label="Level" className="sm:w-36">
                  <Select value={event} onChange={(changeEvent) => setEvent(changeEvent.target.value)}>
                    <option value="">All levels</option>
                    {events.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FieldLabel>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <section aria-label="Exams" className="space-y-3">
        {tests.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-bold text-fg-muted">
              {visibleTests.length} {visibleTests.length === 1 ? "exam" : "exams"}
              {hasFilters ? (visibleTests.length === 1 ? " matches your filters" : " match your filters") : ""} · newest
              first
            </p>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : null}

        {visibleTests.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Illustration kind="empty" size={140} />
            <h2 className="mt-6 font-display text-h3 font-extrabold text-fg">
              {tests.length === 0 ? "No tests yet" : "No exams match these filters"}
            </h2>
            <p className="mt-2 max-w-md text-fg">
              {tests.length === 0
                ? "Practice tests will appear here as soon as they are added."
                : "Try a different cluster, year, or level."}
            </p>
            {hasFilters ? (
              <Button variant="secondary" className="mt-6" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-x-6 border-t-[1.5px] border-rule lg:grid-cols-2">
            {visibleTests.map((test) => (
              <li key={test.id} className="border-b-[1.5px] border-rule">
                <TestRow test={test} status={statuses.get(test.id) ?? null} locked={locked} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TestRow({ test, status, locked }: { test: PracticeTestSummary; status: TestStatus | null; locked: boolean }) {
  const body = (
    <>
      <ClusterIcon cluster={test.cluster} />
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug text-fg">{test.title}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="sr-only">{test.cluster}.</span>
          {test.year ? <Tag>{test.year}</Tag> : null}
          {test.event ? <Tag>{test.event}</Tag> : null}
          <span className="text-label font-semibold text-fg-muted">· {test.questionCount} questions</span>
        </span>
      </span>
      {locked ? (
        <LockSimpleIcon size={18} weight="bold" aria-label="Locked" className="shrink-0 text-fg-muted" />
      ) : (
        <StatusSlot status={status} />
      )}
    </>
  );

  if (locked) {
    return <div className="-mx-3 flex select-none items-center gap-4 px-3 py-4 opacity-55 grayscale">{body}</div>;
  }

  return (
    <Link
      href={`/tests/${test.id}`}
      className="group -mx-3 flex items-center gap-4 rounded-control px-3 py-4 transition-colors hover:bg-surface"
    >
      {body}
    </Link>
  );
}

function StatusSlot({ status }: { status: TestStatus | null }) {
  if (!status) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-small font-bold text-brand-text">
        Start
        <ArrowRightIcon size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
      </span>
    );
  }

  if (status.kind === "in-progress") {
    return (
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden text-right text-label font-bold leading-tight text-fg-muted sm:block">
          In progress
          <span className="block tabular-nums text-fg">
            {status.answered}/{status.total}
          </span>
        </span>
        <ProgressRing value={status.answered / status.total} label={`In progress, ${status.answered} of ${status.total} answered`} />
      </span>
    );
  }

  if (status.correct === null) {
    return <Tag>Completed</Tag>;
  }

  const percent = Math.round((status.correct / status.total) * 100);
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className={`font-display text-h4 font-extrabold tabular-nums ${percent >= 80 ? "text-correct-text" : percent < 60 ? "text-wrong-text" : "text-fg"}`}>
        {percent}%
      </span>
      <span className="text-label font-bold text-fg-muted">Last score</span>
    </span>
  );
}

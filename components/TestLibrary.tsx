"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ds/Button";
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

function useTestStatuses(tests: PracticeTestSummary[]) {
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

export function TestLibrary({ tests }: { tests: PracticeTestSummary[] }) {
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
                <TestRow test={test} status={statuses.get(test.id) ?? null} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TestRow({ test, status }: { test: PracticeTestSummary; status: TestStatus | null }) {
  return (
    <Link
      href={`/tests/${test.id}`}
      className="group -mx-3 flex items-center gap-4 rounded-control px-3 py-4 transition-colors hover:bg-surface"
    >
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
      <StatusSlot status={status} />
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

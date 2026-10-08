"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { loadTestStatus, type TestStatus } from "@/lib/test-progress";
import type { PracticeTestSummary } from "@/types";

const selectClass =
  "rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-2.5 text-sm font-normal outline-none transition focus:border-accent";

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
  const statuses = useTestStatuses(tests);

  const clusters = useMemo(() => Array.from(new Set(tests.map((test) => test.cluster))).sort(), [tests]);
  const years = useMemo(
    () =>
      Array.from(new Set(tests.map((test) => test.year).filter((value): value is number => value !== null))).sort(
        (a, b) => b - a
      ),
    [tests]
  );

  const visibleTests = useMemo(
    () =>
      tests
        .filter((test) => (!cluster || test.cluster === cluster) && (!year || String(test.year) === year))
        .sort(
          (a, b) =>
            (b.year ?? 0) - (a.year ?? 0) || a.cluster.localeCompare(b.cluster) || a.title.localeCompare(b.title)
        ),
    [cluster, tests, year]
  );

  const hasFilters = Boolean(cluster || year);

  return (
    <div className="space-y-6">
      <TestModeSwitch active="full" />

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-6 sm:p-8">
          <div>
            <p className="eyebrow">Practice tests</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Take a full cluster exam</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
              Answers and explanations stay hidden until you submit. Then you get a breakdown by instructional area.
            </p>
          </div>

          {clusters.length > 1 || years.length > 1 ? (
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              {clusters.length > 1 ? (
                <label className="grid flex-1 gap-1.5 text-xs font-semibold text-muted sm:flex-none">
                  Cluster
                  <select className={selectClass} value={cluster} onChange={(event) => setCluster(event.target.value)}>
                    <option value="">All clusters</option>
                    {clusters.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {years.length > 1 ? (
                <label className="grid flex-1 gap-1.5 text-xs font-semibold text-muted sm:flex-none">
                  Year
                  <select className={selectClass} value={year} onChange={(event) => setYear(event.target.value)}>
                    <option value="">All years</option>
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          {tests.length > 0 ? (
            <p className="mb-4 text-sm text-muted">
              {visibleTests.length} {visibleTests.length === 1 ? "exam" : "exams"}
              {hasFilters ? (visibleTests.length === 1 ? " matches your filters" : " match your filters") : ""} · newest
              first
            </p>
          ) : null}

          {visibleTests.length === 0 ? (
            <div className="surface-soft px-6 py-12 text-center">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-ink">
                {tests.length === 0 ? "No tests yet" : "No exams match these filters"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                {tests.length === 0
                  ? "Practice tests will appear here as soon as they are added."
                  : "Try a different cluster or year."}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setCluster("");
                    setYear("");
                  }}
                  className="mt-5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {visibleTests.map((test) => (
                <TestCard key={test.id} test={test} status={statuses.get(test.id) ?? null} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TestCard({ test, status }: { test: PracticeTestSummary; status: TestStatus | null }) {
  const meta = [test.year, test.event, `${test.questionCount} questions`].filter(Boolean).join(" · ");
  const action = status?.kind === "in-progress" ? "Resume" : status?.kind === "completed" ? "View results" : "Start";

  return (
    <Link
      href={`/tests/${test.id}`}
      className="group flex h-full flex-col justify-between gap-4 rounded-[1.4rem] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{test.cluster}</p>
        <h2 className="mt-1.5 text-base font-bold leading-6 tracking-[-0.02em] text-ink">{test.title}</h2>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <StatusPill status={status} />
        <span
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            status?.kind === "in-progress"
              ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-card group-hover:opacity-95"
              : "border border-line text-ink group-hover:bg-[#f8fbff]"
          }`}
        >
          {action}
        </span>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: TestStatus | null }) {
  if (!status) {
    return <span className="text-xs font-medium text-muted">Not started</span>;
  }

  if (status.kind === "in-progress") {
    return (
      <span className="rounded-full border border-blue-100 bg-accentSoft px-3 py-1 text-xs font-semibold text-accent tabular-nums">
        In progress · {status.answered}/{status.total}
      </span>
    );
  }

  if (status.correct === null) {
    return (
      <span className="rounded-full border border-line bg-[#f5f7fb] px-3 py-1 text-xs font-semibold text-muted">
        Completed
      </span>
    );
  }

  const percent = Math.round((status.correct / status.total) * 100);
  const tone =
    percent >= 80
      ? "border-green-200 bg-green-50 text-green-700"
      : percent >= 60
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${tone}`}>
      Last score {percent}%
    </span>
  );
}

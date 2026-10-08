"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { bandStyle, percentOf } from "@/lib/score-scale";
import type { DashboardOverview } from "@/lib/test-results";

const MIN_ANSWERED = 5;
const AREA_LIMIT = 8;
const PI_LIMIT = 10;

type Sort = "weakest" | "practiced" | "az";
const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "weakest", label: "Weakest first" },
  { value: "practiced", label: "Most practiced" },
  { value: "az", label: "A–Z" }
];

type Row = { key: string; label: string; detail?: string | null; answered: number; correct: number };

// Weakest first by default; rows without enough data always go to the bottom.
// (Only areas use the minimum: a single PI rarely has five questions.)
function sortRows<T extends Row>(rows: T[], sort: Sort, minAnswered = MIN_ANSWERED) {
  return [...rows].sort((left, right) => {
    const leftThin = left.answered < minAnswered;
    const rightThin = right.answered < minAnswered;
    if (leftThin !== rightThin) return leftThin ? 1 : -1;
    if (sort === "practiced") return right.answered - left.answered || left.label.localeCompare(right.label);
    if (sort === "az") return left.label.localeCompare(right.label);
    return left.correct / left.answered - right.correct / right.answered || right.answered - left.answered;
  });
}

export function AreaBreakdown({ areas, pis }: { areas: DashboardOverview["areas"]; pis: DashboardOverview["pis"] }) {
  const [sort, setSort] = useState<Sort>("weakest");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(
    () => sortRows(areas.map((area) => ({ key: area.area, label: area.area, answered: area.answered, correct: area.correct })), sort),
    [areas, sort]
  );
  const visible = showAll ? rows : rows.slice(0, AREA_LIMIT);

  return (
    <DashboardSection
      eyebrow="By instructional area"
      title="Success rate by area"
      description={`Click an area to see its performance indicators. Areas with fewer than ${MIN_ANSWERED} questions are listed last.`}
      actions={
        <div className="flex flex-wrap gap-1 rounded-full border border-line bg-[#f5f7fb] p-1 text-sm font-semibold">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => setSort(option.value)}
              className={`rounded-full px-3.5 py-1.5 transition ${
                sort === option.value ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-2 p-6 sm:p-7">
        {visible.map((row) => {
          const isOpen = expanded === row.key;
          return (
            <div key={row.key} className="rounded-[1.2rem] border border-line bg-white">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : row.key)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 basis-full items-center gap-4 text-left sm:basis-auto"
                >
                  <RateRow row={row} />
                </button>
                <Link
                  href={`/tests/custom?area=${encodeURIComponent(row.key)}`}
                  className="ml-auto shrink-0 text-sm font-semibold text-accent hover:underline"
                >
                  Practice
                </Link>
              </div>
              {isOpen ? <PiList pis={pis.filter((pi) => pi.area === row.key)} /> : null}
            </div>
          );
        })}

        {rows.length > AREA_LIMIT ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="mt-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
          >
            {showAll ? "Show fewer" : `Show all ${rows.length} areas`}
          </button>
        ) : null}
      </div>
    </DashboardSection>
  );
}

// Name, bar, percent, and correct / answered, in one compact line.
function RateRow({ row, compact = false, minAnswered = MIN_ANSWERED }: { row: Row; compact?: boolean; minAnswered?: number }) {
  const thin = row.answered < minAnswered;
  const percent = percentOf(row.correct, row.answered);
  const band = bandStyle(percent);

  return (
    <>
      <span className={`min-w-0 flex-1 ${compact ? "text-sm" : ""}`}>
        <span className={`block font-semibold sm:truncate ${thin ? "text-muted" : "text-ink"}`}>{row.label}</span>
        {row.detail ? <span className="block truncate text-xs text-muted">{row.detail}</span> : null}
      </span>
      <span className="hidden h-2 w-28 shrink-0 overflow-hidden rounded-full bg-[#eef2f8] sm:block lg:w-40">
        <span className={`block h-full rounded-full ${thin ? "bg-slate-300" : band.bar}`} style={{ width: `${percent}%` }} />
      </span>
      {thin ? (
        <span className="w-[7.5rem] shrink-0 text-right text-xs font-semibold text-muted">Not enough data</span>
      ) : (
        <span className={`w-12 shrink-0 text-right text-sm font-bold tabular-nums ${band.text}`}>{percent}%</span>
      )}
      <span className="w-16 shrink-0 text-right text-sm text-muted tabular-nums">
        {row.correct} / {row.answered}
      </span>
    </>
  );
}

function PiList({ pis }: { pis: DashboardOverview["pis"] }) {
  const [showAll, setShowAll] = useState(false);
  const rows = sortRows(
    pis.map((pi) => ({ key: pi.pi, label: pi.pi, detail: pi.text, answered: pi.answered, correct: pi.correct })),
    "weakest",
    1
  );
  const visible = showAll ? rows : rows.slice(0, PI_LIMIT);

  return (
    <div className="border-t border-line/80 bg-[#f8fbff] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Performance indicators · weakest first</p>
      <ul className="mt-2 space-y-1.5">
        {visible.map((row) => (
          <li key={row.key} className="flex items-center gap-4 rounded-[0.9rem] bg-white px-3 py-2">
            <RateRow row={row} compact minAnswered={1} />
          </li>
        ))}
      </ul>
      {rows.length > PI_LIMIT ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-2 text-sm font-semibold text-accent hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      ) : null}
    </div>
  );
}

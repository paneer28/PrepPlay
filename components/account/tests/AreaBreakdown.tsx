"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, CaretRightIcon } from "@phosphor-icons/react";
import { DashboardSection } from "@/components/account/tests/DashboardSection";
import { Button } from "@/components/ds/Button";
import { FieldLabel, Select } from "@/components/ds/Field";
import { Collapse } from "@/components/ui/Collapse";
import { customAreaHref, type QuestionSet } from "@/lib/question-sets";
import { percentOf, scoreColor } from "@/lib/score-scale";
import type { DashboardOverview } from "@/lib/test-results";

const MIN_ANSWERED = 5;
const AREA_LIMIT = 5;
const PI_LIMIT = 10;

type Sort = "gain" | "weakest" | "practiced" | "az";
const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "gain", label: "Most points to gain" },
  { value: "weakest", label: "Weakest first" },
  { value: "practiced", label: "Most practiced" },
  { value: "az", label: "A–Z" }
];

type Row = { key: string; label: string; detail?: string | null; answered: number; correct: number };

// Rows without enough data always go last. "Most points to gain" ranks by
// questions missed, so a 1-question area at 0% doesn't outrank a 20-question
// area at 70%. (Only areas use the minimum: a single PI rarely has five.)
function sortRows<T extends Row>(rows: T[], sort: Sort, minAnswered = MIN_ANSWERED) {
  return [...rows].sort((left, right) => {
    const leftThin = left.answered < minAnswered;
    const rightThin = right.answered < minAnswered;
    if (leftThin !== rightThin) return leftThin ? 1 : -1;
    if (sort === "gain") {
      return right.answered - right.correct - (left.answered - left.correct) || left.label.localeCompare(right.label);
    }
    if (sort === "practiced") return right.answered - left.answered || left.label.localeCompare(right.label);
    if (sort === "az") return left.label.localeCompare(right.label);
    return left.correct / left.answered - right.correct / right.answered || right.answered - left.answered;
  });
}

// "Your areas": every instructional area with its score, sortable, each
// opening to its performance indicators.
export function AreaBreakdown({
  areas,
  pis,
  practiceSet = "deca"
}: {
  areas: DashboardOverview["areas"];
  pis: DashboardOverview["pis"];
  practiceSet?: QuestionSet;
}) {
  const [sort, setSort] = useState<Sort>("gain");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(
    () => sortRows(areas.map((area) => ({ key: area.area, label: area.area, answered: area.answered, correct: area.correct })), sort),
    [areas, sort]
  );
  const visible = showAll ? rows : rows.slice(0, AREA_LIMIT);

  return (
    <DashboardSection
      title="Your areas"
      description={`Tap an area to see its performance indicators. Areas with fewer than ${MIN_ANSWERED} questions are listed last.`}
      actions={
        <FieldLabel label="Sort" className="w-full min-w-0 sm:w-56">
          <Select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldLabel>
      }
    >
      <div className="px-5 pb-5 sm:px-6">
        <ul className="divide-y-[1.5px] divide-rule">
          {visible.map((row) => {
            const isOpen = expanded === row.key;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : row.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <CaretRightIcon
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className={`shrink-0 text-fg-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                  <AreaRow row={row} />
                </button>
                <Collapse open={isOpen} lazy>
                  <div className="mb-3 space-y-3 rounded-control bg-surface px-4 py-3">
                    <PiList pis={pis.filter((pi) => pi.area === row.key)} />
                    <Link
                      href={customAreaHref(practiceSet, row.key)}
                      className="inline-flex items-center gap-1 text-small font-bold text-brand-text hover:underline"
                    >
                      Practice this area
                      <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
                    </Link>
                  </div>
                </Collapse>
              </li>
            );
          })}
        </ul>
        {rows.length > AREA_LIMIT ? (
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show fewer" : `Show all ${rows.length} areas`}
          </Button>
        ) : null}
      </div>
    </DashboardSection>
  );
}

// Name with "x of y correct · missed z", then a bar and the percent (or x/y
// when there isn't enough data for a percent to mean much).
function AreaRow({ row, minAnswered = MIN_ANSWERED }: { row: Row; minAnswered?: number }) {
  const thin = row.answered < minAnswered;
  const percent = percentOf(row.correct, row.answered);
  const missed = row.answered - row.correct;

  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="min-w-0 flex-1 basis-full sm:basis-auto">
        <span className={`block font-bold ${thin ? "text-fg-muted" : "text-fg"}`}>{row.label}</span>
        {row.detail ? <span className="block text-label font-semibold text-fg-muted">{row.detail}</span> : null}
        <span className="block text-label font-semibold text-fg-muted tabular-nums">
          {row.correct} of {row.answered} correct · missed {missed}
        </span>
      </span>
      <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-track sm:w-40 sm:flex-none" aria-hidden="true">
        <span
          className={`block h-full rounded-full ${thin ? "bg-rule-strong" : ""}`}
          style={{ width: `${Math.max(percent, 2)}%`, background: thin ? undefined : scoreColor(percent) }}
        />
      </span>
      <span className="w-12 shrink-0 text-right text-small font-extrabold tabular-nums text-fg">
        {thin ? (
          <span className="text-fg-muted" title="Not enough questions for a percent yet">
            {row.correct}/{row.answered}
          </span>
        ) : (
          `${percent}%`
        )}
      </span>
    </span>
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
    <div>
      <p className="text-label font-bold text-fg-muted">Performance indicators · weakest first</p>
      <ul className="mt-1 divide-y-[1.5px] divide-rule">
        {visible.map((row) => (
          <li key={row.key} className="flex items-center py-2 text-small">
            <AreaRow row={row} minAnswered={1} />
          </li>
        ))}
      </ul>
      {rows.length > PI_LIMIT ? (
        <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-2 text-small font-bold text-brand-text hover:underline">
          {showAll ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      ) : null}
    </div>
  );
}

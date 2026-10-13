"use client";

import { ArrowRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ds/Button";
import { FieldLabel, Select } from "@/components/ds/Field";
import { SCORE_BANDS, SCORE_BAND_SAMPLES, percentOf, scoreTint } from "@/lib/score-scale";
import type { CompareData } from "@/lib/test-results";

const PAGE = 6;

type Attempt = CompareData["attempts"][number];
type Cell = { total: number; correct: number };

function shortDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(new Date(value));
}

export function CompareTests({ data, timeZone }: { data: CompareData; timeZone: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE);
  // null = the most recent tests; otherwise the user's own pick.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [mobileId, setMobileId] = useState(data.attempts[0]?.id ?? "");

  const cells = useMemo(() => {
    const map = new Map<string, Cell>();
    for (const cell of data.cells) map.set(`${cell.attempt_id}|${cell.area}`, cell);
    return map;
  }, [data.cells]);

  const shown = picked ? data.attempts.filter((attempt) => picked.includes(attempt.id)) : data.attempts.slice(0, visibleCount);
  const areas = useMemo(() => {
    const ids = new Set(shown.map((attempt) => attempt.id));
    return Array.from(new Set(data.cells.filter((cell) => ids.has(cell.attempt_id)).map((cell) => cell.area))).sort();
  }, [data.cells, shown]);

  const average = (area: string) => {
    let total = 0;
    let correct = 0;
    for (const attempt of shown) {
      const cell = cells.get(`${attempt.id}|${area}`);
      if (cell) {
        total += cell.total;
        correct += cell.correct;
      }
    }
    return total > 0 ? { total, correct } : null;
  };
  const overall = shown.reduce((sum, attempt) => ({ total: sum.total + attempt.total, correct: sum.correct + attempt.correct }), {
    total: 0,
    correct: 0
  });

  const mobileAttempt = data.attempts.find((attempt) => attempt.id === mobileId) ?? data.attempts[0];

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <TrendChart points={data.trend} timeZone={timeZone} />

      {/* Desktop and tablet: the grid */}
      <div className="hidden md:block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-small font-semibold text-fg-muted">
            Showing {shown.length} of {data.attempts.length} {data.attempts.length === 1 ? "test" : "tests"} · newest first
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <TestPicker attempts={data.attempts} picked={picked} onChange={setPicked} />
            {!picked && visibleCount < data.attempts.length ? (
              <Button variant="secondary" size="sm" onClick={() => setVisibleCount((count) => count + PAGE)}>
                Show more tests
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto rounded-control border-[1.5px] border-rule">
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-surface">
                <th scope="col" className="sticky left-0 z-10 min-w-[12rem] border-b-[1.5px] border-r-[1.5px] border-rule bg-surface px-4 py-3 text-left align-bottom text-label font-bold text-fg-muted">
                  Instructional area
                </th>
                {shown.map((attempt) => (
                  <th key={attempt.id} scope="col" className="min-w-[6.5rem] border-b-[1.5px] border-rule px-2 py-2 align-bottom font-normal">
                    <Link
                      href={`/account/tests/${attempt.id}`}
                      className="block rounded-lg px-2 py-1.5 text-center transition-colors hover:bg-page"
                      title={`${attempt.test_title} · ${shortDate(attempt.submitted_at, timeZone)}`}
                    >
                      <span className="block whitespace-nowrap font-extrabold text-fg">{attempt.short}</span>
                      <span className="block text-label font-bold text-fg-muted">
                        {attempt.clusterShort}
                        {attempt.attempt_number > 1 ? ` · attempt ${attempt.attempt_number}` : ""}
                      </span>
                      <ScorePill percent={percentOf(attempt.correct, attempt.total)} />
                    </Link>
                  </th>
                ))}
                <th scope="col" className="min-w-[6rem] border-b-[1.5px] border-l-[1.5px] border-rule px-3 py-2 text-center align-bottom">
                  <span className="block font-extrabold text-fg">Average</span>
                  <ScorePill percent={percentOf(overall.correct, overall.total)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => {
                const avg = average(area);
                return (
                  <tr key={area} className="border-b-[1.5px] border-rule last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 border-r-[1.5px] border-rule bg-page px-4 py-2 text-left font-bold text-fg">
                      {area}
                    </th>
                    {shown.map((attempt) => {
                      const cell = cells.get(`${attempt.id}|${area}`);
                      return (
                        <td key={attempt.id} className="px-2 py-1.5 text-center">
                          {cell ? <ScoreCell cell={cell} href={`/account/tests/${attempt.id}?area=${encodeURIComponent(area)}`} /> : null}
                        </td>
                      );
                    })}
                    <td className="border-l-[1.5px] border-rule px-2 py-1.5 text-center">{avg ? <ScoreCell cell={avg} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend />
      </div>

      {/* Phones: one test at a time */}
      <div className="md:hidden">
        <FieldLabel label="Test">
          <Select value={mobileAttempt?.id} onChange={(event) => setMobileId(event.target.value)}>
            {data.attempts.map((attempt) => (
              <option key={attempt.id} value={attempt.id}>
                {attempt.clusterShort} {attempt.short} · {percentOf(attempt.correct, attempt.total)}%
                {attempt.attempt_number > 1 ? ` (attempt ${attempt.attempt_number})` : ""}
              </option>
            ))}
          </Select>
        </FieldLabel>
        {mobileAttempt ? (
          <>
            <ul className="mt-3 divide-y-[1.5px] divide-rule">
              {data.cells
                .filter((cell) => cell.attempt_id === mobileAttempt.id)
                .sort((left, right) => left.area.localeCompare(right.area))
                .map((cell) => (
                  <li key={cell.area}>
                    <Link
                      href={`/account/tests/${mobileAttempt.id}?area=${encodeURIComponent(cell.area)}`}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="min-w-0 text-small font-bold text-fg">{cell.area}</span>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-label font-extrabold tabular-nums text-fg"
                        style={{ background: scoreTint(percentOf(cell.correct, cell.total)) }}
                      >
                        {cell.correct} of {cell.total} · {percentOf(cell.correct, cell.total)}%
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
            <Link href={`/account/tests/${mobileAttempt.id}`} className="mt-3 inline-flex items-center gap-1 text-small font-bold text-brand-text hover:underline">
              View this attempt
              <ArrowRightIcon size={14} weight="bold" aria-hidden="true" />
            </Link>
          </>
        ) : null}
        <Legend />
      </div>
    </div>
  );
}

function ScorePill({ percent }: { percent: number }) {
  return (
    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-label font-extrabold tabular-nums text-fg" style={{ background: scoreTint(percent) }}>
      {percent}%
    </span>
  );
}

function ScoreCell({ cell, href }: { cell: Cell; href?: string }) {
  const percent = percentOf(cell.correct, cell.total);
  const className = "block rounded-lg px-2 py-1.5 font-extrabold tabular-nums text-fg";
  const label = `${cell.correct} of ${cell.total} correct`;
  const style = { background: scoreTint(percent) };

  return href ? (
    <Link href={href} title={label} aria-label={`${percent}%, ${label}`} style={style} className={`${className} transition hover:brightness-95`}>
      {percent}%
    </Link>
  ) : (
    <span title={label} aria-label={`${percent}%, ${label}`} style={style} className={className}>
      {percent}%
    </span>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label font-semibold text-fg-muted">
      {SCORE_BANDS.map(({ band, label }) => (
        <span key={band} className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded" style={{ background: scoreTint(SCORE_BAND_SAMPLES[band]) }} /> {label}
        </span>
      ))}
      <span>· Blank = the test had no questions in that area · Hover a cell for the question count</span>
    </div>
  );
}

function TestPicker({
  attempts,
  picked,
  onChange
}: {
  attempts: Attempt[];
  picked: string[] | null;
  onChange: (ids: string[] | null) => void;
}) {
  const selected = new Set(picked ?? []);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next.size ? attempts.filter((attempt) => next.has(attempt.id)).map((attempt) => attempt.id) : null);
  };

  return (
    <details className="relative">
      <summary className="btn btn-secondary btn-sm list-none [&::-webkit-details-marker]:hidden">
        {picked ? `Comparing ${picked.length} chosen` : "Choose tests"}
        <CaretDownIcon size={14} weight="bold" aria-hidden="true" />
      </summary>
      <div className="animate-popover-in absolute right-0 z-20 mt-2 max-h-[320px] w-72 origin-top-right overflow-y-auto rounded-card border-[1.5px] border-rule bg-page p-2">
        {picked ? (
          <button type="button" onClick={() => onChange(null)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-small font-bold text-brand-text hover:bg-surface">
            Back to most recent
          </button>
        ) : null}
        {attempts.map((attempt) => (
          <label key={attempt.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-small hover:bg-surface">
            <input type="checkbox" checked={selected.has(attempt.id)} onChange={() => toggle(attempt.id)} className="check" />
            <span className="flex-1 font-semibold text-fg">
              {attempt.clusterShort} {attempt.short}
            </span>
            <span className="text-label font-bold text-fg-muted tabular-nums">{percentOf(attempt.correct, attempt.total)}%</span>
          </label>
        ))}
      </div>
    </details>
  );
}

// Full-test scores over time: a plain SVG line, no chart library.
function TrendChart({ points, timeZone }: { points: CompareData["trend"]; timeZone: string }) {
  const width = 640;
  const height = 170;
  const pad = { top: 12, right: 12, bottom: 26, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (index: number) => pad.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (percent: number) => pad.top + innerH - (percent / 100) * innerH;
  const coords = points.map((point, index) => ({ point, percent: percentOf(point.correct, point.total), cx: x(index) }));

  return (
    <figure>
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-small font-extrabold text-fg">Full-test scores over time</span>
        <span className="text-label font-bold text-fg-muted">
          {points.length} {points.length === 1 ? "attempt" : "attempts"}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Line chart of full-test scores over time">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="stroke-rule" strokeDasharray={tick === 0 ? undefined : "3 4"} />
            <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="10" fontWeight="700" className="fill-fg-muted">
              {tick}%
            </text>
          </g>
        ))}
        {coords.length > 1 ? (
          <polyline
            fill="none"
            className="stroke-brand"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={coords.map(({ cx, percent }) => `${cx},${y(percent)}`).join(" ")}
          />
        ) : null}
        {coords.map(({ point, percent, cx }) => (
          <circle key={point.id} cx={cx} cy={y(percent)} r="5" className="fill-page stroke-brand" strokeWidth="3">
            <title>{`${point.short} · ${shortDate(point.submitted_at, timeZone)} · ${percent}% (${point.correct}/${point.total})`}</title>
          </circle>
        ))}
        {coords.length > 0 ? (
          <>
            <text x={coords[0].cx} y={height - 6} textAnchor={coords.length === 1 ? "middle" : "start"} fontSize="10" fontWeight="700" className="fill-fg-muted">
              {shortDate(coords[0].point.submitted_at, timeZone)}
            </text>
            {coords.length > 1 ? (
              <text x={coords[coords.length - 1].cx} y={height - 6} textAnchor="end" fontSize="10" fontWeight="700" className="fill-fg-muted">
                {shortDate(coords[coords.length - 1].point.submitted_at, timeZone)}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>
    </figure>
  );
}

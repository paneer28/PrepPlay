"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ds/Button";
import { SCORE_BANDS, SCORE_BAND_SAMPLES, percentOf, scoreTint } from "@/lib/score-scale";
import type { CompareData } from "@/lib/test-results";

const PAGE = 6;
// Cells with fewer questions than this are too small to color by score.
const MIN_CELL = 3;
const DESKTOP_QUERY = "(min-width: 1024px)";

type Attempt = CompareData["attempts"][number];
type Cell = { total: number; correct: number };

function shortDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(new Date(value));
}

function testName(item: { short: string; clusterShort: string }) {
  return `${item.clusterShort ? `${item.clusterShort} ` : ""}${item.short}`;
}

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

// Full tests: scores over time, average / best / latest, and a table comparing
// the latest attempt at each test by instructional area.
export function CompareTests({ data, timeZone }: { data: CompareData; timeZone: string }) {
  const points = data.trend;
  const totals = points.reduce((sum, point) => ({ total: sum.total + point.total, correct: sum.correct + point.correct }), { total: 0, correct: 0 });
  const best = points.reduce<(typeof points)[number] | null>(
    (top, point) => (!top || point.correct / point.total > top.correct / top.total ? point : top),
    null
  );
  const latest = points[points.length - 1];

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <TrendChart points={points} timeZone={timeZone} />

      <dl className="grid gap-3 sm:grid-cols-3">
        <Figure label="Average" value={`${percentOf(totals.correct, totals.total)}%`} detail={`${totals.correct} of ${totals.total} correct across ${points.length} ${points.length === 1 ? "attempt" : "attempts"}`} />
        {best ? <Figure label="Best" value={`${percentOf(best.correct, best.total)}%`} detail={testName(best)} /> : null}
        {latest ? (
          <Figure label="Latest" value={`${percentOf(latest.correct, latest.total)}%`} detail={`${testName(latest)} · ${shortDate(latest.submitted_at, timeZone)}`} />
        ) : null}
      </dl>

      {data.attempts.length < 2 ? (
        <p className="rounded-control bg-surface px-4 py-3 text-small text-fg">
          Take another full test and you&apos;ll be able to compare them area by area here.
        </p>
      ) : (
        <CompareTable data={data} timeZone={timeZone} />
      )}
    </div>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-control bg-surface px-4 py-3">
      <dt className="text-label font-bold text-fg-muted">{label}</dt>
      <dd className="font-display text-h3 font-extrabold tabular-nums text-fg">{value}</dd>
      <dd className="text-label font-semibold text-fg-muted [overflow-wrap:anywhere]">{detail}</dd>
    </div>
  );
}

function CompareTable({ data, timeZone }: { data: CompareData; timeZone: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE);
  // null = the most recent tests; otherwise the user's own pick.
  const [picked, setPicked] = useState<string[] | null>(null);
  // null = the default: open on a computer, closed on a phone (set by CSS
  // until the user chooses, so nothing jumps on load).
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const isDesktop = useIsDesktop();
  const open = userOpen ?? isDesktop;
  const bodyId = useId();

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

  // Every question across the shown tests added up, not an average of percents.
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

  return (
    <div>
      <button
        type="button"
        onClick={() => setUserOpen(!open)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="btn btn-secondary"
      >
        Compare tests by area
        <CaretDownIcon size={14} weight="bold" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div id={bodyId} className={`mt-4 ${userOpen === null ? "hidden lg:block" : open ? "block" : "hidden"}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-small font-semibold text-fg-muted">
            Latest attempt at each test · {shown.length} of {data.attempts.length} · newest first
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

        <p className="mb-2 text-label font-bold text-fg-muted lg:hidden">Swipe sideways to see every test →</p>
        <div className="overflow-x-auto rounded-control border-[1.5px] border-rule">
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-surface">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-[9.5rem] min-w-[9.5rem] border-b-[1.5px] border-r-[1.5px] border-rule bg-surface px-3 py-3 text-left align-bottom text-label font-bold text-fg-muted sm:w-auto sm:min-w-[12rem] sm:px-4"
                >
                  Instructional area
                </th>
                {shown.map((attempt) => (
                  <th key={attempt.id} scope="col" className="min-w-[7rem] border-b-[1.5px] border-rule px-2 py-2 align-bottom font-normal">
                    <Link
                      href={`/account/tests/${attempt.id}`}
                      className="block rounded-lg px-2 py-1.5 text-center transition-colors hover:bg-page"
                      title={attempt.test_title}
                    >
                      <span className="block whitespace-nowrap font-extrabold text-fg">{testName(attempt)}</span>
                      <span className="block whitespace-nowrap text-label font-bold text-fg-muted">
                        {shortDate(attempt.submitted_at, timeZone)} · {attempt.total} Q
                        {attempt.attempt_number > 1 ? ` · try ${attempt.attempt_number}` : ""}
                      </span>
                      <ScorePill percent={percentOf(attempt.correct, attempt.total)} />
                    </Link>
                  </th>
                ))}
                <th scope="col" className="min-w-[6.5rem] border-b-[1.5px] border-l-[1.5px] border-rule px-3 py-2 text-center align-bottom">
                  <span className="block font-extrabold text-fg">Average</span>
                  <span className="block text-label font-bold text-fg-muted">{overall.total} Q</span>
                  <ScorePill percent={percentOf(overall.correct, overall.total)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => {
                const avg = average(area);
                return (
                  <tr key={area} className="border-b-[1.5px] border-rule last:border-b-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 w-[9.5rem] min-w-[9.5rem] border-r-[1.5px] border-rule bg-page px-3 py-2 text-left font-bold text-fg sm:w-auto sm:px-4"
                    >
                      {area}
                    </th>
                    {shown.map((attempt) => {
                      const cell = cells.get(`${attempt.id}|${area}`);
                      return (
                        <td key={attempt.id} className="px-2 py-1.5 text-center">
                          {cell ? <ScoreCell cell={cell} href={`/account/tests/${attempt.id}?area=${encodeURIComponent(area)}`} /> : <Missing />}
                        </td>
                      );
                    })}
                    <td className="border-l-[1.5px] border-rule px-2 py-1.5 text-center">{avg ? <ScoreCell cell={avg} /> : <Missing />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend />
      </div>
    </div>
  );
}

function Missing() {
  return (
    <span className="block py-1.5 font-bold text-fg-muted" aria-label="No questions in this area">
      —
    </span>
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
  const thin = cell.total < MIN_CELL;
  const label = `${percent}%, ${cell.correct} of ${cell.total} correct${thin ? ", too few questions to compare" : ""}`;
  const className = `block rounded-lg px-2 py-1.5 tabular-nums ${thin ? "bg-surface text-fg-muted" : "text-fg"}`;
  const style = thin ? undefined : { background: scoreTint(percent) };
  const content = (
    <>
      <span className="block font-extrabold">{percent}%</span>
      <span className={`block text-label font-semibold ${thin ? "" : "text-fg-muted"}`}>
        {cell.correct} of {cell.total}
      </span>
    </>
  );

  return href ? (
    <Link href={href} aria-label={label} style={style} className={`${className} transition hover:brightness-95`}>
      {content}
    </Link>
  ) : (
    <span aria-label={label} style={style} className={className}>
      {content}
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
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded border-[1.5px] border-rule bg-surface" /> Fewer than {MIN_CELL} questions
      </span>
      <span>· — = the test had no questions in that area</span>
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
      <div className="animate-popover-in absolute right-0 z-20 mt-2 max-h-[320px] w-72 max-w-[calc(100vw-3rem)] origin-top-right overflow-y-auto rounded-card border-[1.5px] border-rule bg-page p-2">
        {picked ? (
          <button type="button" onClick={() => onChange(null)} className="mb-1 w-full rounded-lg px-3 py-2 text-left text-small font-bold text-brand-text hover:bg-surface">
            Back to most recent
          </button>
        ) : null}
        {attempts.map((attempt) => (
          <label key={attempt.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-small hover:bg-surface">
            <input type="checkbox" checked={selected.has(attempt.id)} onChange={() => toggle(attempt.id)} className="check" />
            <span className="flex-1 font-semibold text-fg">{testName(attempt)}</span>
            <span className="text-label font-bold text-fg-muted tabular-nums">{percentOf(attempt.correct, attempt.total)}%</span>
          </label>
        ))}
      </div>
    </details>
  );
}

// Width each point needs for its labels; more points than fit scroll inside the chart's box.
const POINT_SPACE = 92;

// Full-test scores over time: one line, each point labeled with its percent,
// and the date and test name under it. Drawn in real pixels so the text stays
// readable at any width.
function TrendChart({ points, timeZone }: { points: CompareData["trend"]; timeZone: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(Math.floor(entry.contentRect.width)));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Start at the newest point.
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollLeft = box.scrollWidth;
  }, [boxWidth, points.length]);

  const width = Math.max(boxWidth, points.length * POINT_SPACE);
  const height = 230;
  const pad = { top: 28, right: POINT_SPACE / 2, bottom: 50, left: 40 };
  const innerW = Math.max(0, width - pad.left - pad.right);
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
      <div ref={boxRef} className="overflow-x-auto">
        {boxWidth > 0 ? (
          <svg width={width} height={height} role="img" aria-label="Line chart of full-test scores over time" className="block">
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - 8} y1={y(tick)} y2={y(tick)} className="stroke-rule" strokeDasharray={tick === 0 ? undefined : "3 4"} />
                <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fontWeight="700" className="fill-fg-muted">
                  {tick}%
                </text>
              </g>
            ))}
            {coords.length > 1 ? (
              <polyline
                fill="none"
                className="stroke-brand"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={coords.map(({ cx, percent }) => `${cx},${y(percent)}`).join(" ")}
              />
            ) : null}
            {coords.map(({ point, percent, cx }) => (
              <g key={point.id}>
                <title>{`${point.test_title} · ${shortDate(point.submitted_at, timeZone)} · ${percent}% (${point.correct} of ${point.total})`}</title>
                <circle cx={cx} cy={y(percent)} r="14" fill="transparent" />
                <circle cx={cx} cy={y(percent)} r="5" className="fill-page stroke-brand" strokeWidth="2.5" />
                <text x={cx} y={y(percent) - 11} textAnchor="middle" fontSize="12" fontWeight="800" className="fill-fg">
                  {percent}%
                </text>
                <text x={cx} y={height - 30} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-fg-muted">
                  {shortDate(point.submitted_at, timeZone)}
                </text>
                <text x={cx} y={height - 14} textAnchor="middle" fontSize="11" fontWeight="600" className="fill-fg-muted">
                  {testName(point).length > 14 ? `${testName(point).slice(0, 13)}…` : testName(point)}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div style={{ height }} />
        )}
      </div>
    </figure>
  );
}

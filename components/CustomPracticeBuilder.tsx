"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { useCustomSessionLauncher } from "@/components/useCustomSessionLauncher";
import { customSessionInProgress, newCustomSession } from "@/lib/test-progress";
import type { PracticeTestSummary, QuestionIndexEntry } from "@/types";

type Facet = "event" | "year" | "cluster" | "area" | "pi";
type Selections = Record<Facet, string[]>;
type PiOption = { code: string; text: string | null; areas: Set<string> };

const FACETS: Facet[] = ["event", "year", "cluster", "area", "pi"];
const EMPTY_SELECTIONS: Selections = { event: [], year: [], cluster: [], area: [], pi: [] };
const COUNT_OPTIONS = [10, 25, 50, 100] as const;
const LEVEL_ORDER = ["district", "state", "icdc"];
const FACET_TITLES: Record<Exclude<Facet, "pi">, string> = {
  event: "Competition level",
  year: "Year released",
  cluster: "Cluster",
  area: "Instructional area"
};

const primaryButton =
  "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";
const secondaryButton =
  "rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50";

function valueOf(entry: QuestionIndexEntry, facet: Facet): string | null {
  switch (facet) {
    case "event":
      return entry.event;
    case "year":
      return entry.year === null ? null : String(entry.year);
    case "cluster":
      return entry.cluster;
    case "area":
      return entry.instructionalArea;
    case "pi":
      return entry.piCode;
  }
}

// An empty facet doesn't restrict anything. A question with no value for a facet
// (e.g. a test with no year) only drops out once that facet is filtered.
function matches(entry: QuestionIndexEntry, selections: Selections, except?: Facet) {
  return FACETS.every((facet) => {
    if (facet === except || selections[facet].length === 0) {
      return true;
    }
    const value = valueOf(entry, facet);
    return value !== null && selections[facet].includes(value);
  });
}

// Counts unique questions: copies of one question on several tests count once per value.
function countBy(entries: QuestionIndexEntry[], facet: Facet) {
  const items = new Map<string, Set<number>>();
  for (const entry of entries) {
    const value = valueOf(entry, facet);
    if (value !== null) {
      const set = items.get(value) ?? new Set<number>();
      set.add(entry.item);
      items.set(value, set);
    }
  }
  return new Map(Array.from(items, ([value, set]) => [value, set.size]));
}

// Keeps the first matching copy of each question, so a repeated question is offered
// (and counted) once, attributed to a test that fits the current filters.
function uniqueItems(entries: QuestionIndexEntry[]) {
  const seen = new Set<number>();
  return entries.filter((entry) => !seen.has(entry.item) && Boolean(seen.add(entry.item)));
}

function distinct(index: QuestionIndexEntry[], facet: Facet) {
  return Array.from(new Set(index.map((entry) => valueOf(entry, facet)).filter((v): v is string => v !== null)));
}

function levelRank(level: string) {
  const rank = LEVEL_ORDER.indexOf(level.trim().toLowerCase());
  return rank === -1 ? LEVEL_ORDER.length : rank;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function listOrCount(values: string[], noun: string, max = 2) {
  return values.length <= max ? values.join(", ") : `${values.length} ${noun}`;
}

function summarize(selections: Selections) {
  const parts = [
    listOrCount(selections.event, "levels"),
    listOrCount([...selections.year].sort().reverse(), "years"),
    listOrCount(selections.cluster, "clusters"),
    listOrCount(selections.area, "areas"),
    selections.pi.length ? listOrCount(selections.pi, "PIs", 3) : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "All tests";
}

export function CustomPracticeBuilder({
  index,
  tests,
  initialAreas = []
}: {
  index: QuestionIndexEntry[];
  tests: PracticeTestSummary[];
  initialAreas?: string[];
}) {
  const [selections, setSelections] = useState<Selections>({ ...EMPTY_SELECTIONS, area: initialAreas });
  const [count, setCount] = useState<number | "all">(25);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inProgress, setInProgress] = useState<{ answered: number; total: number } | null>(null);
  const { launch, dialog } = useCustomSessionLauncher();

  // Saved progress lives in localStorage, which is only readable after mount.
  useEffect(() => {
    setInProgress(customSessionInProgress());
  }, []);

  const matching = useMemo(
    () => uniqueItems(index.filter((entry) => matches(entry, selections))),
    [index, selections]
  );

  const facetCounts = useMemo(() => {
    const result = {} as Record<Facet, Map<string, number>>;
    for (const facet of FACETS) {
      result[facet] = countBy(index.filter((entry) => matches(entry, selections, facet)), facet);
    }
    return result;
  }, [index, selections]);

  const options: Record<Exclude<Facet, "pi">, string[]> = useMemo(
    () => ({
      event: distinct(index, "event").sort((a, b) => levelRank(a) - levelRank(b) || a.localeCompare(b)),
      year: distinct(index, "year").sort((a, b) => Number(b) - Number(a)),
      cluster: distinct(index, "cluster").sort((a, b) => a.localeCompare(b)),
      area: distinct(index, "area").sort((a, b) => a.localeCompare(b))
    }),
    [index]
  );

  // One option per PI code (first non-null text wins), remembering which areas it appears in.
  const piOptions = useMemo(() => {
    const byCode = new Map<string, PiOption>();
    for (const entry of index) {
      const existing = byCode.get(entry.piCode);
      if (existing) {
        existing.text ??= entry.piText;
        existing.areas.add(entry.instructionalArea);
      } else {
        byCode.set(entry.piCode, { code: entry.piCode, text: entry.piText, areas: new Set([entry.instructionalArea]) });
      }
    }
    return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [index]);

  const toggle = (facet: Facet, value: string) => {
    setSelections((current) => {
      const values = current[facet].includes(value)
        ? current[facet].filter((item) => item !== value)
        : [...current[facet], value];
      const next = { ...current, [facet]: values };

      // Keep selected PIs consistent with the chosen instructional areas.
      if (facet === "area" && values.length > 0) {
        next.pi = current.pi.filter((code) =>
          piOptions.some((pi) => pi.code === code && values.some((area) => pi.areas.has(area)))
        );
      }
      return next;
    });
  };

  const clearAll = () => setSelections(EMPTY_SELECTIONS);
  const hasFilters = FACETS.some((facet) => selections[facet].length > 0);

  const total = matching.length;
  const takeAll = count === "all" || count >= total;
  const sessionSize = takeAll ? total : (count as number);

  const start = () => {
    // Pick at random when taking a subset; otherwise keep everything.
    const picked = sessionSize < total ? shuffle(matching).slice(0, sessionSize) : matching;
    // Unshuffled sessions stay grouped by test, in original question order.
    const order = new Map(index.map((entry, position) => [entry.ref, position]));
    const ordered = shuffleOn ? shuffle(picked) : [...picked].sort((a, b) => order.get(a.ref)! - order.get(b.ref)!);

    setDrawerOpen(false);
    const filters = Object.fromEntries(FACETS.filter((facet) => selections[facet].length).map((facet) => [facet, selections[facet]]));
    launch(newCustomSession(ordered.map((entry) => entry.ref), summarize(selections), filters));
  };

  // Only show filters that actually narrow something down.
  const visibleFacets = (Object.keys(FACET_TITLES) as Exclude<Facet, "pi">[]).filter(
    (facet) => options[facet].length > 1
  );

  const summary = (
    <SummaryPanel
      total={total}
      selections={selections}
      onRemove={toggle}
      onClearAll={clearAll}
      count={count}
      takeAll={takeAll}
      sessionSize={sessionSize}
      onCount={setCount}
      shuffleOn={shuffleOn}
      onShuffle={setShuffleOn}
      onStart={start}
    />
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <TestModeSwitch active="custom" />

      <section className="surface overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-6 sm:p-8">
          <p className="eyebrow">Custom practice</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Build your own question set</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
            Pool questions from all {tests.length} {tests.length === 1 ? "exam" : "exams"} and narrow them down. Every
            filter is optional.
          </p>
        </div>

        {inProgress ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 bg-[#f8fbff] px-6 py-4 sm:px-8">
            <p className="text-sm text-ink">
              <span className="font-semibold">Custom session in progress</span>
              <span className="text-muted">
                {" "}
                · {inProgress.answered} of {inProgress.total} answered
              </span>
            </p>
            <Link href="/tests/custom/session" className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]">
              Resume session
            </Link>
          </div>
        ) : null}
      </section>

      {index.length === 0 ? (
        <div className="surface px-6 py-14 text-center">
          <h2 className="text-xl font-bold tracking-[-0.03em] text-ink">No questions yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Custom practice will be available as soon as practice tests are added.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
          <section className="surface overflow-visible">
            <div className="flex items-center justify-between gap-3 border-b border-line/80 px-6 py-4 sm:px-8">
              <h2 className="text-lg font-bold tracking-[-0.03em] text-ink">Filters</h2>
              {hasFilters ? (
                <button type="button" onClick={clearAll} className="text-sm font-semibold text-muted transition hover:text-ink">
                  Clear all
                </button>
              ) : null}
            </div>

            <div>
              {visibleFacets.map((facet) => (
                <FilterGroup key={facet} title={FACET_TITLES[facet]}>
                  <div className="flex flex-wrap gap-2">
                    {options[facet].map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        count={facetCounts[facet].get(value) ?? 0}
                        selected={selections[facet].includes(value)}
                        onClick={() => toggle(facet, value)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ))}

              <FilterGroup title="Performance indicator">
                <PiPicker
                  options={piOptions}
                  areaFilter={selections.area}
                  selected={selections.pi}
                  counts={facetCounts.pi}
                  onToggle={(code) => toggle("pi", code)}
                />
              </FilterGroup>
            </div>
          </section>

          <aside className="surface hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-6 md:sticky md:top-24 md:block">{summary}</aside>
        </div>
      )}

      {index.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-5 text-ink tabular-nums">{total} matching</p>
              <button type="button" onClick={() => setDrawerOpen(true)} className="text-xs font-semibold text-accent">
                {sessionSize} {sessionSize === 1 ? "question" : "questions"} · {shuffleOn ? "shuffled" : "in order"} ·
                Options
              </button>
            </div>
            <button type="button" onClick={start} disabled={total === 0} className={`${primaryButton} py-2.5`}>
              Start
            </button>
          </div>
        </div>
      ) : null}

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/40 backdrop-blur-sm md:hidden" onClick={() => setDrawerOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Session options"
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold tracking-[-0.03em] text-ink">Session options</p>
              <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm font-semibold text-muted">
                Close
              </button>
            </div>
            {summary}
          </div>
        </div>
      ) : null}

      {dialog}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary: count, selected filters, size, shuffle, start              */
/* ------------------------------------------------------------------ */

function SummaryPanel({
  total,
  selections,
  onRemove,
  onClearAll,
  count,
  takeAll,
  sessionSize,
  onCount,
  shuffleOn,
  onShuffle,
  onStart
}: {
  total: number;
  selections: Selections;
  onRemove: (facet: Facet, value: string) => void;
  onClearAll: () => void;
  count: number | "all";
  takeAll: boolean;
  sessionSize: number;
  onCount: (value: number | "all") => void;
  shuffleOn: boolean;
  onShuffle: (value: boolean) => void;
  onStart: () => void;
}) {
  const chips = FACETS.flatMap((facet) =>
    selections[facet].map((value) => ({ facet, value, label: facet === "pi" ? `PI ${value}` : value }))
  );

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Matching questions</p>
      <p aria-live="polite" className="mt-1 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">
        {total}
      </p>

      {total > 0 ? (
        <>
          <button type="button" onClick={onStart} className={`${primaryButton} mt-4 w-full`}>
            Start {sessionSize} {sessionSize === 1 ? "question" : "questions"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">Untimed · progress saves automatically</p>
        </>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-5 border-t border-line/80 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button
                key={`${chip.facet}:${chip.value}`}
                type="button"
                onClick={() => onRemove(chip.facet, chip.value)}
                aria-label={`Remove ${chip.label}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accentSoft px-3 py-1 text-xs font-semibold text-accent transition hover:border-accent"
              >
                {chip.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={onClearAll} className="mt-2 text-xs font-semibold text-muted transition hover:text-ink">
            Clear all
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">From every exam. Add filters to narrow it down.</p>
      )}

      {total === 0 ? (
        <div className="surface-soft mt-5 p-5">
          <p className="font-semibold text-ink">No questions match these filters.</p>
          <p className="mt-1 text-sm leading-6 text-muted">Remove a filter or two to widen the pool.</p>
          <button type="button" onClick={onClearAll} className={`${secondaryButton} mt-4 py-2`}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 border-t border-line/80 pt-5">
            <p className="text-sm font-semibold text-ink">How many questions?</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {COUNT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={!takeAll && count === option}
                  disabled={option >= total}
                  onClick={() => onCount(option)}
                  className={chipClass(!takeAll && count === option, option >= total)}
                >
                  {option}
                </button>
              ))}
              <button type="button" aria-pressed={takeAll} onClick={() => onCount("all")} className={chipClass(takeAll, false)}>
                All ({total})
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={shuffleOn}
              onChange={(event) => onShuffle(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2563eb]"
            />
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold text-ink">Shuffle question order</span>
              <span className="text-xs leading-5 text-muted">Off keeps questions grouped by exam, in their original order.</span>
            </span>
          </label>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter pieces                                                       */
/* ------------------------------------------------------------------ */

function chipClass(active: boolean, disabled: boolean) {
  return `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
    active
      ? "border-accent bg-accentSoft text-accent shadow-[0_0_0_1px_#2563eb]"
      : "border-line bg-white text-ink hover:border-accent/40 hover:bg-[#f8fbff]"
  } ${disabled ? "cursor-not-allowed opacity-40 hover:border-line hover:bg-white" : ""}`;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line/80 px-6 py-5 first:border-t-0 sm:px-8">
      <h3 className="mb-2.5 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  label,
  count,
  selected,
  onClick
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${chipClass(selected, false)} ${!selected && count === 0 ? "opacity-50" : ""}`}
    >
      {label}
      <span className={`ml-2 text-xs tabular-nums ${selected ? "text-accent" : "text-muted"}`}>{count}</span>
    </button>
  );
}

// Searchable PI picker: nothing is listed until the box is focused or typed in,
// results are grouped by instructional area in a scrolling dropdown, and
// selections show as removable chips underneath.
function PiPicker({
  options,
  areaFilter,
  selected,
  counts,
  onToggle
}: {
  options: PiOption[];
  areaFilter: string[];
  selected: string[];
  counts: Map<string, number>;
  onToggle: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byArea = new Map<string, PiOption[]>();
    for (const pi of options) {
      if (q && !pi.code.toLowerCase().includes(q) && !pi.text?.toLowerCase().includes(q)) continue;
      for (const area of pi.areas) {
        if (areaFilter.length && !areaFilter.includes(area)) continue;
        byArea.set(area, [...(byArea.get(area) ?? []), pi]);
      }
    }
    return Array.from(byArea.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [areaFilter, options, query]);

  const flat = useMemo(() => groups.flatMap(([area, pis]) => pis.map((pi) => ({ area, pi }))), [groups]);
  const positions = useMemo(() => new Map(flat.map((item, i) => [`${item.area}:${item.pi.code}`, i])), [flat]);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const next = Math.max(0, Math.min(flat.length - 1, activeIndex + (event.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && open && flat[activeIndex]) {
      event.preventDefault();
      onToggle(flat[activeIndex].pi.code);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="pi-listbox"
        aria-autocomplete="list"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Optional: narrow to specific performance indicators"
        aria-label="Search performance indicators"
        className="w-full rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3 text-sm outline-none transition placeholder:text-muted/80 focus:border-accent"
      />

      {open ? (
        <div
          ref={listRef}
          id="pi-listbox"
          role="listbox"
          aria-multiselectable="true"
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-[300px] overflow-y-auto rounded-[1.1rem] border border-line bg-white py-1 shadow-soft"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">No performance indicators match “{query}”.</p>
          ) : (
            groups.map(([area, pis]) => (
              <div key={area} role="group" aria-label={area}>
                <p className="sticky top-0 bg-white/95 px-4 pb-1 pt-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted backdrop-blur">
                  {area}
                </p>
                {pis.map((pi) => {
                  const index = positions.get(`${area}:${pi.code}`) ?? 0;
                  const isSelected = selected.includes(pi.code);
                  const piCount = counts.get(pi.code) ?? 0;

                  return (
                    <div
                      key={`${area}:${pi.code}`}
                      role="option"
                      aria-selected={isSelected}
                      data-index={index}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => onToggle(pi.code)}
                      onMouseEnter={() => setActive(index)}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-2 text-sm ${
                        index === activeIndex ? "bg-[#f5f8ff]" : ""
                      } ${!isSelected && piCount === 0 ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[0.65rem] ${
                          isSelected ? "border-accent bg-accent text-white" : "border-line bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1 leading-5">
                        <span className="font-semibold text-ink">{pi.code}</span>
                        {pi.text ? <span className="text-muted"> · {pi.text}</span> : null}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">{piCount}</span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onToggle(code)}
              aria-label={`Remove ${code}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accentSoft px-3 py-1 text-xs font-semibold text-accent transition hover:border-accent"
            >
              {code}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

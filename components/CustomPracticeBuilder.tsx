"use client";

import { CheckIcon, SlidersHorizontalIcon, XIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Checkbox } from "@/components/ds/Field";
import { Illustration } from "@/components/ds/Illustration";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
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
    <div className="space-y-10 pb-28 md:pb-0">
      <TestModeSwitch active="custom" />

      <header className="space-y-4">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Build your own question set</h1>
          <p className="text-fg">
            Pool questions from all {tests.length} {tests.length === 1 ? "exam" : "exams"} and narrow them down. Every
            filter is optional.
          </p>
        </div>

        {inProgress ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-brand-tint px-5 py-4">
            <p className="text-fg">
              <span className="font-extrabold">Custom session in progress</span>
              <span className="font-semibold text-fg-muted">
                {" "}
                · {inProgress.answered} of {inProgress.total} answered
              </span>
            </p>
            <ButtonLink href="/tests/custom/session" variant="secondary" size="sm">
              Resume session
            </ButtonLink>
          </div>
        ) : null}
      </header>

      {index.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Illustration kind="empty" size={140} />
          <h2 className="mt-6 font-display text-h3 font-extrabold text-fg">No questions yet</h2>
          <p className="mt-2 max-w-md text-fg">Custom practice will be available as soon as practice tests are added.</p>
        </div>
      ) : (
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="filters-title">
            <div className="flex items-center justify-between gap-3 pb-2">
              <h2 id="filters-title" className="font-display text-h3 font-extrabold text-fg">
                Filters
              </h2>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              ) : null}
            </div>

            <div className="divide-y-[1.5px] divide-rule">
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

          <aside className="card hidden max-h-[calc(100vh-7rem)] overflow-y-auto md:sticky md:top-24 md:block">{summary}</aside>
        </div>
      )}

      {index.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-rule bg-page px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display text-h4 font-extrabold leading-6 text-fg tabular-nums">
                {total} <span className="font-body text-small font-bold text-fg-muted">matching</span>
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1 text-label font-bold text-brand-text"
              >
                <SlidersHorizontalIcon size={14} weight="bold" aria-hidden="true" />
                {sessionSize} {sessionSize === 1 ? "question" : "questions"} · {shuffleOn ? "shuffled" : "in order"} · Options
              </button>
            </div>
            <Button size="lg" onClick={start} disabled={total === 0}>
              Start
            </Button>
          </div>
        </div>
      ) : null}

      <BottomSheet open={drawerOpen} onClose={closeDrawer} label="Session options" title="Session options">
        {summary}
      </BottomSheet>

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
    <div className="space-y-5">
      <div>
        <p className="text-label font-bold text-fg-muted">Matching questions</p>
        <p aria-live="polite" className="font-display text-[56px] font-extrabold leading-none tracking-[-0.03em] text-fg tabular-nums">
          {total}
        </p>
      </div>

      {total > 0 ? (
        <div className="space-y-2">
          <Button size="lg" block onClick={onStart}>
            Start {sessionSize} {sessionSize === 1 ? "question" : "questions"}
          </Button>
          <p className="text-center text-label font-semibold text-fg-muted">Untimed · progress saves automatically</p>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="space-y-2 border-t-[1.5px] border-rule pt-4">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <RemovableTag key={`${chip.facet}:${chip.value}`} label={chip.label} onRemove={() => onRemove(chip.facet, chip.value)} />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="-ml-3">
            Clear all
          </Button>
        </div>
      ) : (
        <p className="text-small text-fg">From every exam. Add filters to narrow it down.</p>
      )}

      {total === 0 ? (
        <div className="space-y-3 border-t-[1.5px] border-rule pt-5">
          <p className="font-extrabold text-fg">No questions match these filters.</p>
          <p className="text-small text-fg">Remove a filter or two to widen the pool.</p>
          <Button variant="secondary" size="sm" onClick={onClearAll}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div role="group" aria-labelledby="session-size-label" className="space-y-2.5 border-t-[1.5px] border-rule pt-5">
            <p id="session-size-label" className="text-small font-extrabold text-fg">
              How many questions?
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNT_OPTIONS.map((option) => (
                <ToggleChip
                  key={option}
                  selected={!takeAll && count === option}
                  disabled={option >= total}
                  onClick={() => onCount(option)}
                >
                  {option}
                </ToggleChip>
              ))}
              <ToggleChip selected={takeAll} onClick={() => onCount("all")}>
                All ({total})
              </ToggleChip>
            </div>
          </div>

          <Checkbox
            checked={shuffleOn}
            onChange={(event) => onShuffle(event.target.checked)}
            className="items-start [&>input]:mt-0.5"
            label={
              <span className="grid gap-0.5">
                <span className="font-extrabold text-fg">Shuffle question order</span>
                <span className="text-label font-semibold text-fg-muted">Off keeps questions grouped by exam, in their original order.</span>
              </span>
            }
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter pieces                                                       */
/* ------------------------------------------------------------------ */

// Filter chips are toggle buttons in the tag shape: tint + brand border when on.
function ToggleChip({
  selected,
  disabled = false,
  dim = false,
  onClick,
  children
}: {
  selected: boolean;
  disabled?: boolean;
  dim?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] px-4 text-small font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-brand bg-brand-tint text-brand-text"
          : "border-rule bg-page text-fg hover:border-rule-strong enabled:hover:bg-surface"
      } ${dim && !selected ? "opacity-50" : ""}`}
    >
      {selected ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function RemovableTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="tag min-h-8 gap-1.5 border-[1.5px] border-transparent px-3 transition-colors hover:border-brand"
      data-tone="brand"
    >
      {label}
      <XIcon size={12} weight="bold" aria-hidden="true" />
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-5">
      <h3 className="mb-3 font-body text-small font-extrabold text-fg">{title}</h3>
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
    <ToggleChip selected={selected} dim={count === 0} onClick={onClick}>
      {label}
      <span className={`text-label tabular-nums ${selected ? "text-brand-text" : "text-fg-muted"}`}>{count}</span>
    </ToggleChip>
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
        className="field"
      />

      {open ? (
        <div
          ref={listRef}
          id="pi-listbox"
          role="listbox"
          aria-multiselectable="true"
          className="animate-popover-in absolute inset-x-0 top-full z-20 mt-2 max-h-[320px] origin-top overflow-y-auto rounded-card border-[1.5px] border-rule bg-page py-1"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-4 text-small text-fg">No performance indicators match “{query}”.</p>
          ) : (
            groups.map(([area, pis]) => (
              <div key={area} role="group" aria-label={area}>
                <p className="sticky top-0 bg-page px-4 pb-1 pt-3 text-label font-extrabold text-fg-muted">
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
                      className={`flex cursor-pointer items-start gap-3 px-4 py-2 text-small ${
                        index === activeIndex ? "bg-surface" : ""
                      } ${!isSelected && piCount === 0 ? "opacity-50" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] ${
                          isSelected ? "border-brand bg-brand text-white" : "border-rule-strong bg-page"
                        }`}
                      >
                        {isSelected ? <CheckIcon size={12} weight="bold" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 leading-5">
                        <span className="font-extrabold text-fg">{pi.code}</span>
                        {pi.text ? <span className="text-fg"> · {pi.text}</span> : null}
                      </span>
                      <span className="shrink-0 text-label font-bold text-fg-muted tabular-nums">{piCount}</span>
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
            <RemovableTag key={code} label={code} onRemove={() => onToggle(code)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

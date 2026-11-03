"use client";

import {
  CaretDownIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CrosshairIcon,
  InfinityIcon,
  LockSimpleIcon,
  StarIcon,
  TrophyIcon
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ds/Button";
import { ProgressBar } from "@/components/ds/ProgressBar";
import {
  findWeakSpots,
  loadLocalProgress,
  markRoadItems,
  readRawLocalProgress,
  PASS_PERCENT,
  recommendationReason,
  viewRoad,
  WEAK_SPOT_MIN_ANSWERS,
  type Road,
  type RoadProgress,
  type RoadStop,
  type StopState,
  type UnitView,
  type WeakSpots
} from "@/lib/road-shared";

const noSubscribe = () => () => {};

const STATE_WORDS: Record<StopState, string> = { done: "finished", current: "up next", locked: "locked" };

function StopGlyph({ stop, state }: { stop: RoadStop; state: StopState }) {
  const props = { size: 28, weight: "bold", "aria-hidden": true } as const;
  if (stop.kind === "checkpoint") return <TrophyIcon {...props} />;
  if (stop.kind === "mini") return <ChatsCircleIcon {...props} />;
  if (state === "done") return <CheckIcon {...props} />;
  if (state === "locked") return <LockSimpleIcon {...props} />;
  return <StarIcon {...props} weight="fill" />;
}

function StopButton({ stop, state, percent }: { stop: RoadStop; state: StopState; percent: number | null }) {
  const detail = stop.kind === "flashcard" ? ", flashcard only" : stop.roleplayOnly ? `, ${stop.roleplayOnly} roleplay-only` : "";
  const label = `${stop.title}, ${STATE_WORDS[state]}${percent !== null && state === "done" ? `, ${percent}%` : ""}${detail}`;

  return state === "locked" ? (
    <span role="img" aria-label={label} title="Finish the stops before this one first" className="road-stop" data-state="locked">
      <StopGlyph stop={stop} state={state} />
    </span>
  ) : (
    <Link href={stop.href} aria-label={label} title={stop.title} className="road-stop" data-state={state}>
      <StopGlyph stop={stop} state={state} />
    </Link>
  );
}

const STOP_CTA: Record<RoadStop["kind"], string> = {
  pi: "Start lesson",
  flashcard: "Start lesson",
  deck: "Start lesson",
  checkpoint: "Start checkpoint",
  mini: "Start roleplay"
};

function stopMeta(stop: RoadStop) {
  const minutes = (count: number) => `~${Math.max(1, Math.round(count * 0.8))} min`;
  if (stop.kind === "pi") return `${stop.codes[0]} · ${stop.questions} ${stop.questions === 1 ? "question" : "questions"} · ${minutes(stop.questions)}`;
  if (stop.kind === "flashcard") return `${stop.codes[0]} · Flashcard · ~1 min`;
  if (stop.kind === "checkpoint") return `${stop.questions} questions · ${minutes(stop.questions)}`;
  if (stop.kind === "deck") return `${stop.codes.length} ${stop.codes.length === 1 ? "card" : "cards"} · ${minutes(stop.codes.length)}`;
  return "Short roleplay · ~15 min";
}

// Where a stop sits across the page, as a share of --road-amp: a smooth curve out
// to one side and over to the other, every eight stops.
const WAVE = [0, 0.71, 1, 0.71, 0, -0.71, -1, -0.71];
const waveAt = (index: number) => WAVE[index % WAVE.length];

// A unit's stops, curving down the page. The next one carries a card with what
// it is and how to start it.
function Path({ view, road, progress }: { view: UnitView; road: Road; progress: RoadProgress }) {
  return (
    <div className="[--road-amp:100px] [--road-card-amp:0px] sm:[--road-amp:170px] sm:[--road-card-amp:120px]">
      {view.carried > 0 ? (
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-small font-bold text-fg-muted">
          <CheckCircleIcon size={18} weight="fill" aria-hidden="true" className="shrink-0 text-streak-text" />
          {view.carried} {view.carried === 1 ? "deck" : "decks"} carried over from State.
        </p>
      ) : null}
      <ol className="space-y-4 py-6">
        {view.stops.map((item, index) => {
          const wave = waveAt(index);
          return (
            <li key={item.stop.id} className="flex flex-col items-center">
              {item.state === "current" ? (
                <div className="mb-3 w-full max-w-[320px]" style={{ transform: `translateX(calc(${wave} * var(--road-card-amp)))` }}>
                  <div className="rounded-card border-[1.5px] border-rule-strong bg-surface p-4">
                    <p className="font-bold leading-snug text-fg">{item.stop.title}</p>
                    <p className="mt-1 text-label font-semibold text-fg-muted">{stopMeta(item.stop)}</p>
                    <p className="mt-2 text-label font-semibold text-fg">{recommendationReason(item.stop, road, progress)}</p>
                    <ButtonLink href={item.stop.href} block className="btn-road mt-3">
                      {STOP_CTA[item.stop.kind]}
                    </ButtonLink>
                  </div>
                  <span aria-hidden="true" className="mx-auto -mt-[8px] block size-3.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-rule-strong bg-surface" style={{ translate: `calc(${wave} * (var(--road-amp) - var(--road-card-amp)))` }} />
                </div>
              ) : null}
              <div className="flex w-[150px] flex-col items-center gap-2 sm:w-[190px]" style={{ transform: `translateX(calc(${wave} * var(--road-amp)))` }}>
                <StopButton {...item} />
                {item.state === "current" ? null : (
                  <p aria-hidden="true" title={item.stop.title} className={`line-clamp-3 text-center text-label font-bold ${item.state === "done" ? "text-fg" : "text-fg-muted"}`}>
                    {item.stop.title}
                    {item.percent !== null && item.state === "done" ? <span className="block font-semibold tabular-nums text-fg-muted">{item.percent}%</span> : null}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// "OP · 15 performance indicators · 62 questions"
function unitMeta(view: UnitView) {
  const { unit } = view;
  const learning = unit.stops.filter((stop) => stop.kind === "pi" || stop.kind === "flashcard");
  if (learning.length === 0) {
    const decks = unit.stops.filter((stop) => stop.kind === "deck").length;
    return `${unit.kicker} · ${decks} ${decks === 1 ? "deck" : "decks"} · mini roleplay`;
  }
  const prefixes = new Set(learning.map((stop) => stop.codes[0].split(":")[0]));
  const questions = learning.reduce((sum, stop) => sum + stop.questions, 0);
  return [
    unit.kicker.startsWith("Part ") ? unit.kicker : null,
    prefixes.size === 1 ? [...prefixes][0] : null,
    `${learning.length} performance ${learning.length === 1 ? "indicator" : "indicators"}`,
    questions ? `${questions} ${questions === 1 ? "question" : "questions"}` : null
  ]
    .filter(Boolean)
    .join(" · ");
}

const unitElementId = (view: UnitView) => `unit-${view.unit.id}`;

// One unit: a banner that unfolds its stops in place.
function Unit({
  view,
  number,
  open,
  underWay,
  locked,
  needsReview,
  onToggle,
  road,
  progress
}: {
  view: UnitView;
  number: number;
  open: boolean;
  // Started, or the next one to start.
  underWay: boolean;
  // Past anything reached so far.
  locked: boolean;
  // Finished, but its instructional area is a weak spot.
  needsReview: boolean;
  onToggle: (top: number) => void;
  road: Road;
  progress: RoadProgress;
}) {
  const panelId = `${unitElementId(view)}-stops`;
  const lit = open && !view.done;
  const count = `${view.doneCount} of ${view.totalCount}`;
  const tone = lit
    ? "bg-[var(--road)] text-white shadow-[0_4px_0_var(--road-edge)]"
    : locked
      ? "border-[1.5px] border-dashed border-rule-strong bg-surface hover:border-fg-muted"
      : "border-[1.5px] border-rule bg-surface hover:border-rule-strong";
  const quiet = lit ? "" : "text-fg-muted";

  return (
    <section id={unitElementId(view)} className="scroll-mt-24">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={(event) => onToggle(event.currentTarget.getBoundingClientRect().top)}
          className={`flex w-full items-center justify-between gap-3 rounded-card px-5 py-4 text-left transition-colors sm:px-6 ${tone}`}
        >
          <span className="min-w-0">
            <span className={`block text-label font-extrabold uppercase tracking-[0.06em] ${quiet}`}>
              Unit {number}
              {view.done ? " · Complete" : underWay ? " · In progress" : ""}
            </span>
            <span className={`mt-0.5 block font-display text-h3 font-extrabold ${lit ? "text-white" : locked ? "text-fg-muted" : "text-fg"}`}>{view.unit.title}</span>
            <span className={`mt-0.5 block text-small font-semibold ${quiet}`}>{unitMeta(view)}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            {needsReview ? <span className="rounded-full bg-streak-tint px-3 py-1 text-label font-extrabold text-streak-text">Needs review</span> : null}
            {view.done ? (
              <span className="rounded-full bg-correct-tint px-3 py-1 text-label font-extrabold tabular-nums text-correct-text">{view.percent !== null ? `${view.percent}% correct` : "Complete"}</span>
            ) : lit ? (
              <span className="rounded-full bg-[var(--road-edge)] px-3 py-1 text-label font-extrabold tabular-nums text-white">{count}</span>
            ) : locked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-track px-3 py-1 text-label font-extrabold text-fg-muted">
                <LockSimpleIcon size={13} weight="bold" aria-hidden="true" />
                Locked
              </span>
            ) : (
              <span className="rounded-full bg-track px-3 py-1 text-label font-extrabold tabular-nums text-fg">{count}</span>
            )}
            <CaretDownIcon size={16} weight="bold" aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${quiet} ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </h2>
      <div id={panelId} hidden={!open}>
        {open ? <Path view={view} road={road} progress={progress} /> : null}
      </div>
    </section>
  );
}

// Above the units, without moving them. Until an area has enough answers it shows
// how close the first one is.
function WeakSpotsCard({ weak, examLabel }: { weak: WeakSpots; examLabel: string }) {
  const [top, ...others] = weak.spots;
  return (
    <section aria-labelledby="weak-spots" className="rounded-card border-[1.5px] border-rule bg-page p-4 shadow-[0_4px_0_var(--rule)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-streak-tint text-streak-text">
          <CrosshairIcon size={24} weight="bold" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="weak-spots" className="font-display text-h4 font-extrabold text-fg">
            {top ? "Fix your weak spots" : weak.enough ? "No weak spots right now" : "Find your weak spots"}
          </h2>
          {top ? (
            <p className="mt-0.5 text-small text-fg">
              <span className="font-bold">{top.area}</span>: you&apos;re at {top.percent}%, and it came up {top.timesTested} {top.timesTested === 1 ? "time" : "times"} on past {examLabel} exams.
            </p>
          ) : weak.enough ? (
            <p className="mt-0.5 text-small text-fg">Every area you&apos;ve practiced enough is at {PASS_PERCENT}% or higher.</p>
          ) : (
            <p className="mt-0.5 text-small text-fg">Answer {WEAK_SPOT_MIN_ANSWERS - weak.mostAnswered} more {WEAK_SPOT_MIN_ANSWERS - weak.mostAnswered === 1 ? "question" : "questions"} in one instructional area and your first result shows up here.</p>
          )}
        </div>
        {top ? (
          <ButtonLink href={top.href} size="sm" className="btn-road hidden h-11 shrink-0 sm:inline-flex">
            Practice
          </ButtonLink>
        ) : null}
      </div>
      {top ? (
        <ButtonLink href={top.href} block className="btn-road mt-3 sm:hidden">
          Practice {top.area}
        </ButtonLink>
      ) : null}
      {!top && !weak.enough ? <ProgressBar value={weak.mostAnswered / WEAK_SPOT_MIN_ANSWERS} tone="road" label="Answers until your first weak spot result" className="mt-3 !h-2.5" /> : null}
      {others.length > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small font-semibold text-fg-muted">
          Also:
          {others.slice(0, 2).map((spot) => (
            <Link key={spot.area} href={spot.href} className="inline-flex min-h-11 items-center rounded-control font-bold text-[var(--road-text)] hover:underline sm:min-h-0">
              {spot.area} ({spot.percent}%)
            </Link>
          ))}
        </p>
      ) : null}
    </section>
  );
}

function UnlimitedCard({ href }: { href: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border-[1.5px] border-rule bg-page p-4 shadow-[0_4px_0_var(--rule)]">
      <span className="grid size-11 shrink-0 place-items-center rounded-control bg-brand-tint text-brand-text">
        <InfinityIcon size={24} weight="bold" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1">
        <span className="block font-display text-h4 font-extrabold text-fg">Infinite</span>
        <span className="block text-label font-semibold text-fg-muted">Nonstop questions, misses first</span>
      </p>
      <ButtonLink href={href} size="sm" className="h-11 shrink-0">
        <span className="sr-only">Start Infinite</span>
        <span aria-hidden="true">Start</span>
      </ButtonLink>
    </div>
  );
}

function RoadMap({ views, openId, onPick }: { views: UnitView[]; openId: string | null; onPick: (view: UnitView) => void }) {
  const done = views.filter((view) => view.done).length;
  return (
    <section aria-labelledby="road-map" className="rounded-card border-[1.5px] border-rule bg-page p-4">
      <h2 id="road-map" className="font-display text-h4 font-extrabold text-fg">
        Your road
      </h2>
      <p className="text-label font-semibold text-fg-muted">
        {done} of {views.length} units finished
      </p>
      <ol className="mt-3 max-h-[60vh] space-y-0.5 overflow-y-auto overscroll-contain [scrollbar-width:none] lg:max-h-[calc(100vh-280px)] [&::-webkit-scrollbar]:hidden">
        {views.map((view, index) => {
          const percent = view.totalCount ? (view.doneCount / view.totalCount) * 100 : 0;
          const current = view.unit.id === openId;
          return (
            <li key={view.unit.id}>
              <button
                type="button"
                onClick={() => onPick(view)}
                aria-current={current ? "step" : undefined}
                className={`block w-full rounded-[10px] px-2 py-1.5 text-left transition-colors ${current ? "bg-[var(--road-tint)]" : "hover:bg-surface"}`}
              >
                <span className="flex items-baseline justify-between gap-2 text-label font-bold">
                  <span className={`min-w-0 truncate ${current ? "text-fg" : "text-fg-muted"}`}>
                    {index + 1}. {view.unit.title}
                    {view.unit.kicker.startsWith("Part ") ? <span className="font-semibold"> · {view.unit.kicker.replace(/^Part (\d+) of \d+$/, "$1")}</span> : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-fg-muted">
                    {view.doneCount}/{view.totalCount}
                  </span>
                </span>
                <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-full bg-track">
                  <span className={`block h-full rounded-full ${view.done ? "bg-streak" : "bg-[var(--road)]"}`} style={{ width: `${percent}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// One road: every unit in its fixed order, with one unfolded at a time, plus
// Infinite and a map of the whole road alongside. Guests' progress lives in this
// browser; signed-in progress comes from the account.
export function RoadView({
  road,
  saved,
  unlimitedHref
}: {
  road: Road;
  saved: RoadProgress | null;
  // Exams only.
  unlimitedHref?: string;
}) {
  const raw = useSyncExternalStore(noSubscribe, readRawLocalProgress, () => null);
  const progress = useMemo<RoadProgress>(() => {
    if (raw === null) return saved ?? { scores: {}, items: [] };
    const local = loadLocalProgress();
    return saved ? { scores: saved.scores, items: [...new Set([...saved.items, ...local.items])] } : local;
  }, [raw, saved]);

  // Anything finished before signing in, or while offline, gets saved to the account.
  useEffect(() => {
    if (!saved) return;
    const known = new Set(saved.items);
    const missing = loadLocalProgress().items.filter((item) => !known.has(item));
    if (missing.length > 0) void markRoadItems(missing);
  }, [saved]);

  const view = useMemo(() => viewRoad(road, progress), [road, progress]);
  const weak = useMemo(() => (road.kind === "exam" ? findWeakSpots(road, progress) : null), [road, progress]);
  const weakAreas = new Set(weak?.spots.map((spot) => spot.area));

  // Which unit is unfolded: undefined until the student picks, null with all folded.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const openId = picked === undefined ? (view.startingUnit?.unit.id ?? null) : picked;

  // Folding a long unit above would throw the page around, so after a change the
  // clicked banner goes back where it was (top), or into view from the map (null).
  const settle = useRef<{ id: string; top: number | null } | null>(null);
  useLayoutEffect(() => {
    const target = settle.current;
    if (!target) return;
    settle.current = null;
    const element = document.getElementById(`unit-${target.id}`);
    if (!element) return;
    if (target.top === null) element.scrollIntoView({ block: "start" });
    else window.scrollBy({ top: element.getBoundingClientRect().top - target.top, behavior: "instant" });
  }, [openId]);

  const isStarted = (unit: UnitView) => unit.doneCount > 0 || unit.percent !== null;
  const firstUnfinished = view.units.findIndex((unit) => !unit.done);
  const reached = Math.max(firstUnfinished, view.units.reduce((last, unit, index) => (isStarted(unit) ? index : last), -1));

  const units = (
    <div className="min-w-0 space-y-4">
      {weak ? <WeakSpotsCard weak={weak} examLabel={road.examLabel} /> : null}
      {view.units.map((unit, index) => {
        const id = unit.unit.id;
        return (
          <Unit
            key={id}
            view={unit}
            number={index + 1}
            open={id === openId}
            underWay={index === firstUnfinished || isStarted(unit)}
            locked={index > reached}
            needsReview={unit.done && weakAreas.has(unit.unit.title)}
            onToggle={(top) => {
              settle.current = { id, top };
              setPicked(id === openId ? null : id);
            }}
            road={road}
            progress={progress}
          />
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      {unlimitedHref ? (
        <div className="lg:hidden">
          <UnlimitedCard href={unlimitedHref} />
        </div>
      ) : null}
      {units}
      <aside aria-label="Road overview" className="space-y-4 lg:sticky lg:top-24">
        {unlimitedHref ? (
          <div className="hidden lg:block">
            <UnlimitedCard href={unlimitedHref} />
          </div>
        ) : null}
        <RoadMap
          views={view.units}
          openId={openId}
          onPick={(unit) => {
            if (unit.unit.id === openId) {
              document.getElementById(`unit-${unit.unit.id}`)?.scrollIntoView({ block: "start" });
              return;
            }
            settle.current = { id: unit.unit.id, top: null };
            setPicked(unit.unit.id);
          }}
        />
      </aside>
    </div>
  );
}

// The Exams and Roleplays roads: what the browser needs to draw one and work out
// progress. Safe to import from client components.

export const PASS_PERCENT = 80;

export type StopKind = "pi" | "flashcard" | "checkpoint" | "deck" | "mini";

export type RoadStop = {
  id: string;
  kind: StopKind;
  title: string;
  href: string;
  // PI codes this stop covers.
  codes: string[];
  questions: number;
  // Times these PIs appeared on the past DECA exams.
  appearances: number;
  // Decks: how many of its PIs are only ever in the roleplay, never on the exam.
  roleplayOnly: number;
  // Progress item, for stops finished by something other than question scores.
  item: string | null;
};

export type RoadUnit = {
  id: string;
  kicker: string;
  title: string;
  stops: RoadStop[];
  // ICDC repeats State's full list, so what's already finished moves out of the way.
  carriesOver: boolean;
};

export type Road = {
  kind: "exam" | "roleplay";
  // Whose past exams the stops' counts come from, for saying so ("Finance", "DECA").
  examLabel: string;
  units: RoadUnit[];
};

export type PiScore = { answered: number; correct: number };

export type RoadProgress = {
  // Latest answer per PrepPlay question, added up per PI. Finishes road stops.
  scores: Record<string, PiScore>;
  // The same across every test, real DECA exams included. Finds weak spots.
  allScores?: Record<string, PiScore>;
  items: string[];
};

export const piSlug = (code: string) => code.replace(":", "-");
export const piFromSlug = (slug: string) => slug.replace("-", ":");
export const cardItem = (code: string) => `card:${code}`;

export type StopState = "done" | "current" | "locked";

export function stopScore(stop: RoadStop, progress: RoadProgress) {
  if (stop.kind !== "pi") return null;
  const score = stop.codes.reduce(
    (sum, code) => ({
      answered: sum.answered + (progress.scores[code]?.answered ?? 0),
      correct: sum.correct + (progress.scores[code]?.correct ?? 0)
    }),
    { answered: 0, correct: 0 }
  );
  return score.answered ? { ...score, percent: Math.round((score.correct / score.answered) * 100) } : null;
}

export function isStopDone(stop: RoadStop, progress: RoadProgress, items: Set<string>) {
  if (stop.kind === "pi") {
    const score = stopScore(stop, progress);
    return Boolean(score && score.answered >= stop.questions && score.percent >= PASS_PERCENT);
  }
  if (stop.kind === "deck") return stop.codes.every((code) => items.has(cardItem(code)));
  return stop.item !== null && items.has(stop.item);
}

const isFinale = (stop: RoadStop) => stop.kind === "checkpoint" || stop.kind === "mini";

export type UnitView = {
  unit: RoadUnit;
  // What's shown; on carrying-over levels, finished decks are dropped.
  stops: Array<{ stop: RoadStop; state: StopState; percent: number | null }>;
  doneCount: number;
  totalCount: number;
  carried: number;
  done: boolean;
  percent: number | null;
  recommended: RoadStop | null;
};

export function viewUnit(unit: RoadUnit, progress: RoadProgress, items: Set<string>): UnitView {
  const finished = new Set(unit.stops.filter((stop) => isStopDone(stop, progress, items)).map((stop) => stop.id));
  // Stops open one at a time, along the path. They're laid out most-tested first.
  const recommended = unit.stops.find((stop) => !finished.has(stop.id)) ?? null;

  // A finished unit shows everything, so it can be reviewed.
  const everyDone = finished.size === unit.stops.length;
  const visible = unit.stops.filter((stop) => everyDone || !unit.carriesOver || isFinale(stop) || !finished.has(stop.id));
  const scored = unit.stops.flatMap((stop) => stopScore(stop, progress) ?? []);
  const answered = scored.reduce((sum, score) => sum + score.answered, 0);
  const correct = scored.reduce((sum, score) => sum + score.correct, 0);

  return {
    unit,
    stops: visible.map((stop) => ({
      stop,
      state: finished.has(stop.id) ? "done" : stop.id === recommended?.id ? "current" : "locked",
      percent: stopScore(stop, progress)?.percent ?? null
    })),
    doneCount: finished.size,
    totalCount: unit.stops.length,
    carried: unit.stops.length - visible.length,
    done: unit.stops.length > 0 && finished.size === unit.stops.length,
    percent: answered ? Math.round((correct / answered) * 100) : null,
    recommended
  };
}

export type RoadView = {
  // Every unit, always in the road's own order.
  units: UnitView[];
  // Open to start with: a unit already under way, otherwise the first unfinished one.
  startingUnit: UnitView | null;
};

export function viewRoad(road: Road, progress: RoadProgress): RoadView {
  const items = new Set(progress.items);
  const units = road.units.map((unit) => viewUnit(unit, progress, items));
  const open = units.filter((view) => !view.done);
  return { units, startingUnit: open.find((view) => view.doneCount > 0 || view.percent !== null) ?? open[0] ?? null };
}

// The sentence on the next stop's card.
export function recommendationReason(stop: RoadStop, road: Road, progress: RoadProgress) {
  if (stop.kind === "checkpoint") return "You've finished every stop in this unit. This checkpoint mixes them together.";
  if (stop.kind === "mini") return "You've learned this level's indicators. Now use them in a short roleplay.";
  if (stop.kind === "deck") {
    return stop.roleplayOnly
      ? `This deck has ${stop.roleplayOnly} roleplay-only ${stop.roleplayOnly === 1 ? "indicator" : "indicators"} that won't be on your exam, but your judge can ask about them.`
      : "Your roleplay can draw on these indicators, and you haven't finished this deck yet.";
  }
  const seen = stop.appearances === 1 ? "once" : `${stop.appearances} times`;
  const exams = `past ${road.examLabel} exams`;
  const score = stopScore(stop, progress);
  if (stop.kind === "flashcard") return "Learn this indicator from its flashcard. Practice questions for it are on the way.";
  if (!score) return stop.appearances ? `It came up ${seen} on ${exams}, and you haven't practiced it yet.` : "You haven't practiced this indicator yet.";
  return stop.appearances
    ? `It came up ${seen} on ${exams}, and your score is ${score.percent}%. ${PASS_PERCENT}% finishes it.`
    : `Your score is ${score.percent}%. ${PASS_PERCENT}% finishes it.`;
}

/* Weak spots ---------------------------------------------------------------- */

export const areaSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// An area needs this many answers before its score means anything.
export const WEAK_SPOT_MIN_ANSWERS = 15;

export type WeakSpot = { area: string; href: string; answered: number; percent: number; timesTested: number };

export type WeakSpots = {
  // Worst first: most tested on this exam times share missed.
  spots: WeakSpot[];
  // The most answers in any one area, for showing how close the first one is.
  mostAnswered: number;
  // At least one area has enough answers to judge.
  enough: boolean;
};

export function findWeakSpots(road: Road, progress: RoadProgress): WeakSpots {
  const scores = progress.allScores ?? progress.scores;
  const areas = new Map<string, { answered: number; correct: number; timesTested: number; questions: number }>();
  for (const unit of road.units) {
    const area = areas.get(unit.title) ?? { answered: 0, correct: 0, timesTested: 0, questions: 0 };
    for (const stop of unit.stops) {
      if (stop.kind !== "pi" && stop.kind !== "flashcard") continue;
      const score = scores[stop.codes[0]];
      area.answered += score?.answered ?? 0;
      area.correct += score?.correct ?? 0;
      area.timesTested += stop.appearances;
      area.questions += stop.questions;
    }
    areas.set(unit.title, area);
  }

  const all = [...areas];
  const judged = all.filter(([, area]) => area.answered >= WEAK_SPOT_MIN_ANSWERS);
  const spots = judged
    .map(([name, area]) => ({ name, area, percent: Math.round((area.correct / area.answered) * 100) }))
    // Practice comes from PrepPlay's questions, so an area without any has nothing to offer yet.
    .filter(({ area, percent }) => percent < PASS_PERCENT && area.questions > 0)
    .sort((a, b) => b.area.timesTested * (100 - b.percent) - a.area.timesTested * (100 - a.percent))
    .map(({ name, area, percent }) => ({
      area: name,
      href: `/learn/road/weak-${areaSlug(name)}`,
      answered: area.answered,
      percent,
      timesTested: area.timesTested
    }));

  return { spots, enough: judged.length > 0, mostAnswered: Math.max(0, ...all.map(([, area]) => area.answered)) };
}

/* Browser storage: guests' progress, and anything not yet saved to the account. */

const STORAGE_KEY = "prepplay:road";
type Stored = { items: string[]; answers: Record<string, { pi: string; correct: boolean }> };

function readStored(): Stored {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Stored | null;
    return { items: stored?.items ?? [], answers: stored?.answers ?? {} };
  } catch {
    return { items: [], answers: {} };
  }
}

function writeStored(stored: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
  }
}

export const readRawLocalProgress = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export function loadLocalProgress(): RoadProgress {
  const { items, answers } = readStored();
  const scores: Record<string, PiScore> = {};
  for (const { pi, correct } of Object.values(answers)) {
    const score = (scores[pi] ??= { answered: 0, correct: 0 });
    score.answered += 1;
    if (correct) score.correct += 1;
  }
  return { items, scores };
}

export function recordLocalAnswers(answers: Array<{ ref: string; pi: string; correct: boolean }>) {
  const stored = readStored();
  for (const { ref, pi, correct } of answers) stored.answers[ref] = { pi, correct };
  writeStored(stored);
}

// Saved here first, then to the account when signed in (ignored otherwise).
export async function markRoadItems(items: string[]) {
  const stored = readStored();
  stored.items = [...new Set([...stored.items, ...items])];
  writeStored(stored);
  try {
    await fetch("/api/road-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
  } catch {
    // Offline: it stays in this browser, and syncs the next time the road opens.
  }
}

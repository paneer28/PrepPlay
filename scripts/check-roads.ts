// Checks the road rules against the real data: npm run check:roads
import assert from "node:assert/strict";
import { DECA_EVENTS } from "../lib/deca-events";
import { buildExamRoad, buildRoleplayRoad, getLearnEvent, originalRefsByPi, questionsForPi } from "../lib/roads";
import { cardItem, findWeakSpots, isStopDone, viewRoad, WEAK_SPOT_MIN_ANSWERS, type RoadProgress } from "../lib/road-shared";
import { getAllTests, getQuestionLookup } from "../lib/tests";

const empty: RoadProgress = { scores: {}, items: [] };
const originals = getQuestionLookup("original");
let events = 0;

for (const deca of DECA_EVENTS) {
  const event = getLearnEvent(deca.code);
  if (!event) {
    assert.equal(deca.code, "PFL");
    continue;
  }
  events += 1;
  const exam = buildExamRoad(event, deca.examCluster);
  const stops = exam.units.flatMap((unit) => unit.stops);
  const piStops = stops.filter((stop) => stop.kind === "pi" || stop.kind === "flashcard");

  // Every exam PI exactly once, and no roleplay-only PI.
  assert.deepEqual(piStops.map((stop) => stop.id).sort(), [...event.examPIs].sort(), deca.code);
  const only = new Set(event.rolePlayOnlyPIs);
  assert.ok(piStops.every((stop) => !only.has(stop.id)), `${deca.code}: roleplay-only PI on the exam road`);
  // Coverage gaps are flashcard-only, never an empty question set.
  assert.ok(piStops.every((stop) => (stop.kind === "pi") === stop.questions > 0), deca.code);

  const road = buildRoleplayRoad(event);
  if (["FCE", "HTPS", "PSE", "IMCE", "IMCP", "IMCS"].includes(deca.code)) {
    assert.equal(road, null, `${deca.code} should have no roleplay road`);
  } else {
    assert.ok(road, deca.code);
    assert.deepEqual(road.units.map((unit) => unit.id), ["districts", "state", "icdc"]);
    const districts = new Set(event.districtRolePlay.flatMap((scenario) => scenario.pis));
    const districtStops = road.units[0].stops.filter((stop) => stop.kind === "deck");
    assert.deepEqual(new Set(districtStops.flatMap((stop) => stop.codes)), districts, `${deca.code}: Districts PIs`);
    const fullCodes = road.units[1].stops.filter((stop) => stop.kind === "deck").flatMap((stop) => stop.codes);
    assert.deepEqual(new Set(fullCodes), new Set(event.rolePlayPIs), `${deca.code}: State PIs`);

    // Learning the Districts cards finishes those decks where they are...
    const afterDistricts = viewRoad(road, { scores: {}, items: [...districts].map(cardItem) });
    const districtDecks = afterDistricts.units[0].stops.filter(({ stop }) => stop.kind === "deck");
    assert.ok(districtDecks.length > 0 && districtDecks.every(({ state }) => state === "done"), deca.code);

    // ...and with the full list learned, ICDC is down to its mini roleplay.
    const icdc = viewRoad(road, { scores: {}, items: event.rolePlayPIs.map(cardItem) }).units[2];
    assert.deepEqual(icdc.stops.map(({ stop }) => stop.kind), ["mini"], deca.code);
    assert.equal(icdc.stops[0].state, "current", deca.code);
  }
}
assert.equal(events, 33);

// Only PrepPlay's own questions can reach a road.
for (const code of originalRefsByPi().keys()) {
  for (const question of questionsForPi(code)) assert.equal(question.origin?.original, true);
  for (const ref of originalRefsByPi().get(code)!) assert.ok(originals.has(ref));
}

// The 80% rule and the flow through a unit, on HRM.
const road = buildExamRoad(getLearnEvent("HRM")!, "Business Management and Administration");
const unit = road.units.find((item) => item.stops.some((stop) => stop.kind === "pi" && stop.questions >= 5) && item.stops.some((stop) => stop.kind === "checkpoint"))!;
const stop = unit.stops.find((item) => item.kind === "pi" && item.questions >= 5)!;
const code = stop.codes[0];
const items = new Set<string>();
const score = (answered: number, correct: number): RoadProgress => ({ scores: { [code]: { answered, correct } }, items: [] });
assert.equal(isStopDone(stop, score(stop.questions, stop.questions - 2), items), stop.questions - 2 >= 0.8 * stop.questions);
assert.equal(isStopDone(stop, score(stop.questions, Math.ceil(stop.questions * 0.8)), items), true, "80% finishes a stop");
assert.equal(isStopDone(stop, score(stop.questions - 1, stop.questions - 1), items), false, "every question has to be answered");

const inUnit = (progress: RoadProgress) => viewRoad(road, progress).units.find((view) => view.unit.id === unit.id)!;

// Starts on one next stop with the checkpoint locked; finishing the stops opens the checkpoint.
const start = inUnit(empty);
assert.equal(start.stops.find(({ stop: item }) => item.kind === "checkpoint")?.state, "locked");
assert.equal(start.stops.filter(({ state }) => state === "current").length, 1);
const all: RoadProgress = {
  scores: Object.fromEntries(unit.stops.filter((item) => item.kind === "pi").map((item) => [item.codes[0], { answered: item.questions, correct: item.questions }])),
  items: unit.stops.filter((item) => item.kind === "flashcard").map((item) => item.item!)
};
const learned = inUnit(all);
const checkpoint = learned.stops.find(({ stop: item }) => item.kind === "checkpoint")!;
assert.equal(checkpoint.state, "current", "the checkpoint opens last");
assert.equal(learned.done, false);
assert.equal(viewRoad(road, all).startingUnit?.unit.id, unit.id, "a unit under way opens first");

// Passing it finishes the unit, and the road opens somewhere else.
const finished: RoadProgress = { ...all, items: [...all.items, checkpoint.stop.item!] };
assert.equal(inUnit(finished).done, true);
assert.notEqual(viewRoad(road, finished).startingUnit?.unit.id, unit.id);

// Units are in most-tested order and never move or renumber, whatever's been practiced.
const tested = road.units.map((item) => item.stops.reduce((sum, stop) => sum + stop.appearances, 0));
assert.deepEqual(tested, [...tested].sort((a, b) => b - a));
const order = (progress: RoadProgress) => viewRoad(road, progress).units.map((view) => view.unit.id);
assert.deepEqual(order(finished), order(empty));
assert.deepEqual(order(all), road.units.map((item) => item.id));

// Weak spots: nothing until an area has enough answers, real exam answers count,
// the worst heavily-tested area comes first, and none of it moves or finishes anything.
const areaOf = (title: string) => road.units.filter((item) => item.title === title).flatMap((item) => item.stops).filter((item) => item.kind === "pi");
const [busy, quiet] = [road.units[0].title, road.units[road.units.length - 1].title];
const spread = (title: string, answered: number, correct: number) => {
  const stops = areaOf(title);
  return Object.fromEntries(stops.map((item, index) => [item.codes[0], index === 0 ? { answered, correct } : { answered: 0, correct: 0 }]));
};
assert.equal(findWeakSpots(road, { scores: spread(busy, WEAK_SPOT_MIN_ANSWERS - 1, 0), items: [] }).enough, false, "not enough answers yet");
assert.equal(findWeakSpots(road, { scores: spread(busy, WEAK_SPOT_MIN_ANSWERS - 1, 0), items: [] }).mostAnswered, WEAK_SPOT_MIN_ANSWERS - 1);
const realMisses: RoadProgress = { scores: {}, allScores: spread(busy, 20, 8), items: [] };
assert.equal(findWeakSpots(road, realMisses).spots[0].area, busy, "real exam misses count");
assert.equal(findWeakSpots(road, realMisses).spots[0].percent, 40);
assert.equal(findWeakSpots(road, { scores: {}, allScores: spread(busy, 20, 18), items: [] }).spots.length, 0, "90% isn't a weak spot");
assert.equal(findWeakSpots(road, { scores: {}, allScores: spread(busy, 20, 18), items: [] }).enough, true);
const both = findWeakSpots(road, { scores: {}, allScores: { ...spread(quiet, 20, 4), ...spread(busy, 20, 8) }, items: [] }).spots.map((spot) => spot.area);
assert.equal(both[0], busy, "a heavily tested area outranks a rarely tested one that's only a bit worse");
assert.deepEqual(order(realMisses), order(empty));
assert.equal(viewRoad(road, realMisses).units.some((view) => view.doneCount > 0), false, "real exam answers don't finish road stops");

// Each exam's road follows that exam's own history: counts match a hand tally of its
// real tests, its units run most-tested first, and events on the same exam match.
const firstUnits = new Map<string, string>();
for (const deca of DECA_EVENTS) {
  const event = getLearnEvent(deca.code);
  if (!event) continue;
  const exam = buildExamRoad(event, deca.examCluster);
  const totals = exam.units.map((item) => item.stops.reduce((sum, stop) => sum + stop.appearances, 0));
  assert.deepEqual(totals, [...totals].sort((a, b) => b - a), deca.code);
  const tests = getAllTests("deca").filter((test) => test.cluster === deca.examCluster);
  if (tests.length) {
    const sample = exam.units[0].stops[0];
    const tally = tests.reduce((sum, test) => sum + test.questions.filter((question) => question.performanceIndicator.code === sample.id).length, 0);
    assert.equal(sample.appearances, tally, deca.code);
    assert.equal(exam.examLabel, deca.examCluster);
  }
  const key = `${deca.examCluster} [${event.examPIs.length}]`;
  const units = exam.units.map((item) => item.id).join();
  if (firstUnits.has(key)) assert.equal(units, firstUnits.get(key), `${deca.code} should match its exam's road`);
  firstUnits.set(key, units);
}
for (const [key, units] of firstUnits) console.log(`${key}: ${units.split(",").slice(0, 5).join(", ")}`);

console.log(`✓ Roads check out for ${events} events.`);

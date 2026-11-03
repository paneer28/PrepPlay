import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { questionRef } from "@/lib/test-format";
import { getAllTests, getQuestionLookup } from "@/lib/tests";
import type { TestQuestion } from "@/types";
import { areaSlug, cardItem, piSlug, type PiScore, type Road, type RoadProgress, type RoadStop, type RoadUnit } from "@/lib/road-shared";
import type { DecaEvent } from "@/lib/deca-events";

// Server side of the roads: builds them from the 2026-27 official PI data in
// data/learn and PrepPlay's own questions. Real DECA content never goes on a road.

type LearnEvent = {
  code: string;
  name: string;
  cluster: string;
  examPIs: string[];
  rolePlayPIs: string[];
  rolePlayOnlyPIs: string[];
  districtRolePlay: Array<{ scenario: number; area: string; pis: string[] }>;
};
type LearnPi = { code: string; text: string; instructionalArea: string; realExamAppearances: number };
export type Flashcard = { code: string; front: string; back: string; instructionalArea: string };

type Learn = { events: Map<string, LearnEvent>; pis: Map<string, LearnPi>; cards: Map<string, Flashcard> };

let learnCache: Learn | null = null;

function read<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "learn", file), "utf8")) as T;
}

function learn(): Learn {
  if (learnCache) return learnCache;
  learnCache = {
    events: new Map(read<LearnEvent[]>("events.json").map((event) => [event.code, event])),
    pis: new Map(read<LearnPi[]>("pis.json").map((pi) => [pi.code, pi])),
    cards: new Map(read<Flashcard[]>("flashcards.json").map((card) => [card.code, card]))
  };
  return learnCache;
}

export function getLearnEvent(code: string) {
  return learn().events.get(code) ?? null;
}

export const getFlashcard = (code: string) => learn().cards.get(code) ?? null;
export const getPi = (code: string) => learn().pis.get(code) ?? null;

// Refs of PrepPlay's own questions per PI code.
let refsCache: Map<string, string[]> | null = null;

export function originalRefsByPi() {
  if (refsCache) return refsCache;
  const refs = new Map<string, string[]>();
  for (const test of getAllTests("original")) {
    for (const question of test.questions) {
      const code = question.performanceIndicator.code;
      refs.set(code, [...(refs.get(code) ?? []), questionRef(test.id, question.number)]);
    }
  }
  refsCache = refs;
  return refs;
}

// A stop's questions, with copies of the same question dropped (the attempt
// upload drops them the same way, so positions line up). Built once: a road asks
// for every PI it has.
let questionsCache: Map<string, TestQuestion[]> | null = null;

export function questionsForPi(code: string) {
  if (!questionsCache) {
    const lookup = getQuestionLookup("original");
    questionsCache = new Map();
    for (const [pi, refs] of originalRefsByPi()) {
      const seen = new Set<string>();
      questionsCache.set(
        pi,
        refs.flatMap((ref) => {
          const question = lookup.get(ref);
          const key = question ? JSON.stringify([question.question, question.options]) : "";
          if (!question || seen.has(key)) return [];
          seen.add(key);
          return [question];
        })
      );
    }
  }
  return questionsCache.get(code) ?? [];
}

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// A checkpoint is a spread over the unit: one question per PI, then round again if there's room.
export function checkpointRefs(codes: string[], length: number) {
  const pools = codes.map((code) => shuffled(originalRefsByPi().get(code) ?? []));
  const refs: string[] = [];
  for (let round = 0; refs.length < length && pools.some((pool) => pool[round]); round += 1) {
    for (const pool of shuffled(pools)) {
      if (pool[round] && refs.length < length) refs.push(pool[round]);
    }
  }
  return refs;
}


const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

// Long instructional areas are split so a unit stays finishable in a few sittings.
const MAX_UNIT_STOPS = 15;
const CHECKPOINT_MIN_QUESTIONS = 5;
const DECK_SIZE = 10;

export const checkpointItem = (unitId: string) => `checkpoint:${unitId}`;

function byArea(codes: string[]) {
  const { pis } = learn();
  const areas = new Map<string, LearnPi[]>();
  for (const code of codes) {
    const pi = pis.get(code);
    if (pi) areas.set(pi.instructionalArea, [...(areas.get(pi.instructionalArea) ?? []), pi]);
  }
  return areas;
}

// How many questions on the real exams of one cluster tested each PI. Only the
// counts leave this file: no real exam content goes on a road.
const countsCache = new Map<string, Map<string, number>>();

function timesTestedIn(examCluster: string) {
  const cached = countsCache.get(examCluster);
  if (cached) return cached;
  const counts = new Map<string, number>();
  for (const test of getAllTests("deca")) {
    if (test.cluster !== examCluster) continue;
    for (const question of test.questions) {
      const code = question.performanceIndicator.code;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  countsCache.set(examCluster, counts);
  return counts;
}

const byAppearances = (a: LearnPi, b: LearnPi) => b.realExamAppearances - a.realExamAppearances || a.code.localeCompare(b.code);

// Every event on an exam gets the same road, ordered by what that exam has tested
// most. A cluster with no real exams on file falls back to all 97 past tests.
export function buildExamRoad(event: LearnEvent, examCluster: string): Road {
  const clusterCounts = timesTestedIn(examCluster);
  const times = (pi: LearnPi) => (clusterCounts.size ? (clusterCounts.get(pi.code) ?? 0) : pi.realExamAppearances);
  const mostTested = (a: LearnPi, b: LearnPi) => times(b) - times(a) || a.code.localeCompare(b.code);

  const units: RoadUnit[] = [...byArea(event.examPIs)].flatMap(([area, list]) => {
    const parts = chunk([...list].sort(mostTested), MAX_UNIT_STOPS);
    return parts.map((part, index) => {
      const id = `${areaSlug(area)}${parts.length > 1 ? `-${index + 1}` : ""}`;
      const stops: RoadStop[] = part.map((pi) => {
        const questions = questionsForPi(pi.code).length;
        return {
          id: pi.code,
          kind: questions ? "pi" : "flashcard",
          title: pi.text,
          href: `/learn/road/${piSlug(pi.code)}`,
          codes: [pi.code],
          questions,
          appearances: times(pi),
          roleplayOnly: 0,
          item: questions ? null : cardItem(pi.code)
        };
      });
      const questions = stops.reduce((sum, stop) => sum + stop.questions, 0);
      if (questions >= CHECKPOINT_MIN_QUESTIONS) {
        stops.push({
          id: `checkpoint-${id}`,
          kind: "checkpoint",
          title: "Checkpoint",
          href: `/learn/road/checkpoint-${id}`,
          codes: part.map((pi) => pi.code),
          questions: Math.min(10, questions),
          appearances: 0,
          roleplayOnly: 0,
          item: checkpointItem(id)
        });
      }
      return {
        id,
        kicker: parts.length > 1 ? `Part ${index + 1} of ${parts.length}` : "Instructional area",
        title: area,
        stops,
        carriesOver: false
      };
    });
  });

  // Set here and never changed by a student's progress, so units stay put and keep their numbers.
  const timesTested = (unit: RoadUnit) => unit.stops.reduce((sum, stop) => sum + stop.appearances, 0);
  return { kind: "exam", examLabel: clusterCounts.size ? examCluster : "DECA", units: units.sort((a, b) => timesTested(b) - timesTested(a)) };
}

function deckStops(event: LearnEvent, codes: string[], prefix: string): RoadStop[] {
  const only = new Set(event.rolePlayOnlyPIs);
  return [...byArea(codes)].flatMap(([area, list]) => {
    // Exam PIs first, so roleplay-only ones gather in the last decks of an area.
    const sorted = [...list].sort((a, b) => Number(only.has(a.code)) - Number(only.has(b.code)) || byAppearances(a, b));
    const decks = chunk(sorted, DECK_SIZE);
    return decks.map((deck, index) => {
      const id = `${prefix}${areaSlug(area)}-${index + 1}`;
      return {
        id,
        kind: "deck" as const,
        title: decks.length > 1 ? `${area} ${index + 1}` : area,
        href: `/learn/roleplay/${id}`,
        codes: deck.map((pi) => pi.code),
        questions: 0,
        appearances: deck.reduce((sum, pi) => sum + pi.realExamAppearances, 0),
        roleplayOnly: deck.filter((pi) => only.has(pi.code)).length,
        item: null
      };
    });
  });
}

const LEVEL_DIFFICULTY = { districts: "easy", state: "medium", icdc: "hard" } as const;
export type RoadLevel = keyof typeof LEVEL_DIFFICULTY;

function miniStop(event: LearnEvent, level: RoadLevel, label: string, area?: string): RoadStop {
  const item = `mini:${event.code}:${level}`;
  const params = new URLSearchParams({ road: item, difficulty: LEVEL_DIFFICULTY[level] });
  if (area) params.set("area", area);
  return {
    id: `mini-${level}`,
    kind: "mini",
    title: `${label} mini roleplay`,
    href: `/roleplays?${params}`,
    codes: [],
    questions: 0,
    appearances: 0,
    roleplayOnly: 0,
    item
  };
}

// Null for exam-only events, whose presentations aren't built from a PI list.
export function buildRoleplayRoad(event: LearnEvent): Road | null {
  if (event.rolePlayPIs.length === 0) return null;

  // Series events have two scenarios, which can share an instructional area.
  const districtAreas = [...new Set(event.districtRolePlay.map((scenario) => scenario.area))];
  const districtCodes = [...new Set(event.districtRolePlay.flatMap((scenario) => scenario.pis))];
  const scenarios = event.districtRolePlay.length;
  const full = deckStops(event, event.rolePlayPIs, "");

  return {
    kind: "roleplay",
    examLabel: "DECA",
    units: [
      {
        id: "districts",
        kicker: scenarios > 1 ? `${scenarios} scenarios` : "1 scenario",
        title: `Districts: ${districtAreas.join(" and ")}`,
        stops: [...deckStops(event, districtCodes, "districts-"), miniStop(event, "districts", "Districts", districtAreas[0])],
        carriesOver: false
      },
      {
        id: "state",
        kicker: "Full indicator list",
        title: "State",
        stops: [...full, miniStop(event, "state", "State")],
        carriesOver: false
      },
      {
        id: "icdc",
        kicker: "Full indicator list",
        title: "ICDC",
        stops: [...full, miniStop(event, "icdc", "ICDC")],
        carriesOver: true
      }
    ]
  };
}

export function examRoadFor(event: DecaEvent | null) {
  const learnEvent = event ? getLearnEvent(event.code) : null;
  return event && learnEvent ? buildExamRoad(learnEvent, event.examCluster) : null;
}

/* Saved progress ------------------------------------------------------------ */

type LatestAnswer = { source_test_id: string; source_number: number; pi_code: string; is_correct: boolean };

// The signed-in student's latest answer to every question on every test, by ref.
// Null when signed out or saved results aren't set up.
const getLatestAnswers = cache(async (): Promise<Map<string, LatestAnswer> | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return null;

  const latest = new Map<string, LatestAnswer>();
  const PAGE = 1000;
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from("test_attempt_answers")
      .select("source_test_id, source_number, pi_code, is_correct")
      .eq("unanswered", false)
      .order("submitted_at", { ascending: true })
      .order("position", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    for (const row of data as LatestAnswer[]) latest.set(questionRef(row.source_test_id, row.source_number), row);
    if (data.length < PAGE) break;
  }
  return latest;
});

// Full sets, custom practice and Infinite all count. Stops finish on PrepPlay's
// questions; weak spots look at everything, real DECA exams included.
export async function getRoadProgress(): Promise<RoadProgress | null> {
  const latest = await getLatestAnswers();
  const supabase = await createClient();
  if (!latest || !supabase) return null;

  const originals = new Set(getAllTests("original").map((test) => test.id));
  const scores: Record<string, PiScore> = {};
  const allScores: Record<string, PiScore> = {};
  const add = (target: Record<string, PiScore>, row: LatestAnswer) => {
    const score = (target[row.pi_code] ??= { answered: 0, correct: 0 });
    score.answered += 1;
    if (row.is_correct) score.correct += 1;
  };
  for (const row of latest.values()) {
    add(allScores, row);
    if (originals.has(row.source_test_id)) add(scores, row);
  }

  // Missing table: the migration hasn't been run, so items stay in the browser.
  const { data: rows } = await supabase.from("road_progress").select("item");
  return { scores, allScores, items: (rows ?? []).map((row) => row.item as string) };
}

// A weak-spot practice set: PrepPlay questions from the area, the ones this student
// last got wrong first, then ones they haven't seen, then the rest.
export async function weakSpotRefs(codes: string[], length: number) {
  const latest = await getLatestAnswers();
  const refs = shuffled(codes.flatMap((code) => originalRefsByPi().get(code) ?? []));
  const rank = (ref: string) => {
    const answer = latest?.get(ref);
    return !answer ? 1 : answer.is_correct ? 2 : 0;
  };
  return [...refs].sort((a, b) => rank(a) - rank(b)).slice(0, length);
}

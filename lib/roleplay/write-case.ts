import { createHash } from "node:crypto";
import { PARTICIPANT_INSTRUCTIONS, SKILLS_21ST_CENTURY } from "@/lib/config";
import { getEventById, getPracticeOptions } from "@/lib/data";
import { familiesForEvent, makeBusiness, makeJudgeName, type Business, type Family } from "@/lib/roleplay/businesses";
import { eventFormat } from "@/lib/roleplay/format";
import { makeRng, pick, shuffled, type Rng } from "@/lib/roleplay/random";
import { THEMES, type Theme } from "@/lib/roleplay/themes";
import type { EventOption, ParticipantRoleplay, PerformanceIndicator, RoleplayRequest } from "@/types";

// Writes a roleplay case: one instructional area, PIs that all fit one business
// problem, a named fictional business with real numbers, a named judge with a
// concern, and a short task list. See lib/roleplay/themes.ts for the problems.

export type CaseOptions = {
  // Short hashes of the user's recent cases (business type + problem), to avoid.
  seenHashes?: Set<string>;
  // The user's lowest-scoring PI codes, lowest first (Weak PIs mode).
  weakCodes?: string[];
  rng?: Rng;
};

// Which instructional areas matter most for each event, so cases lean toward
// what the event is about. Other areas with a fitting theme still appear.
const FOCUS_AREAS: Record<string, string[]> = {
  "principles-bma": ["Operations", "Business Law", "Economics", "Communication Skills", "Emotional Intelligence", "Customer Relations"],
  "bltdm-team": ["Business Law", "Emotional Intelligence"],
  "hrm-series": ["Human Resources Management", "Emotional Intelligence", "Operations"],
  "principles-finance": ["Financial Analysis", "Economics", "Customer Relations"],
  "act-series": ["Financial Analysis"],
  "bfs-series": ["Financial Analysis", "Risk Management"],
  "ftdm-team": ["Financial Analysis", "Professional Development", "Business Law"],
  "principles-marketing": ["Promotion", "Selling", "Product/Service Management", "Marketing-Information Management", "Economics"],
  "aam-series": ["Product/Service Management", "Selling", "Promotion"],
  "rms-series": ["Product/Service Management", "Selling", "Promotion", "Operations"],
  "asm-series": ["Promotion", "Marketing-Information Management", "Product/Service Management", "Selling"],
  "bsm-series": ["Promotion", "Marketing-Information Management", "Product/Service Management", "Selling"],
  "food-series": ["Promotion", "Marketing-Information Management", "Product/Service Management"],
  "sem-series": ["Promotion", "Marketing-Information Management", "Product/Service Management"],
  "mcs-series": ["Promotion"],
  "btdm-team": ["Product/Service Management", "Operations"],
  "mtdm-team": ["Promotion", "Marketing-Information Management", "Product/Service Management", "Market Planning"],
  "stdm-team": ["Promotion", "Marketing-Information Management", "Product/Service Management"],
  "principles-hospitality": ["Customer Relations", "Operations", "Selling"],
  "htps-series": ["Selling", "Customer Relations"],
  "htdm-team": ["Customer Relations", "Operations", "Information Management"],
  "hlm-series": ["Operations", "Customer Relations", "Selling"],
  "qsrm-series": ["Operations", "Customer Relations", "Professional Development"],
  "rfsm-series": ["Operations", "Customer Relations", "Financial Analysis"],
  "ttdm-team": ["Promotion", "Selling", "Operations"],
  "ent-series": ["Entrepreneurship", "Strategic Management", "Financial Analysis"],
  "etdm-team": ["Entrepreneurship", "Strategic Management"]
};

const CLIENT_ROLES = new Set(["client", "member", "meeting planner", "events director", "purchasing director", "operations manager", "business owner"]);

export class CaseError extends Error {}

type Candidate = { theme: Theme; pis: PerformanceIndicator[]; families: Family[] };

// The event's PIs in a theme's list, one per code, in the theme's order.
function themePis(theme: Theme, byCode: Map<string, PerformanceIndicator>) {
  return theme.codes.map((code) => byCode.get(code)).filter((pi): pi is PerformanceIndicator => Boolean(pi && pi.instructionalArea === theme.area));
}

function themeFamilies(theme: Theme, event: EventOption) {
  const eventFamilies = familiesForEvent(event.id);
  return theme.families ? theme.families.filter((family) => eventFamilies.includes(family)) : eventFamilies;
}

export function caseHash(businessKind: string, themeId: string) {
  return createHash("sha256").update(`${businessKind.toLowerCase()}|${themeId}`).digest("hex").slice(0, 12);
}

// Every theme the event can use: its PIs fill the event's count and at least
// one of its business types fits the event.
export function candidatesFor(event: EventOption, need = eventFormat(event.id).pis): Candidate[] {
  const byCode = new Map<string, PerformanceIndicator>();
  for (const pi of getPracticeOptions().performanceIndicators) {
    if (pi.eventIds.includes(event.id) && !byCode.has(pi.code)) byCode.set(pi.code, pi);
  }
  return THEMES.map((theme) => ({ theme, pis: themePis(theme, byCode), families: themeFamilies(theme, event) })).filter(
    (candidate) => candidate.pis.length >= need && candidate.families.length > 0
  );
}

// Picks the PIs: seeds first (in order), then the rest at random from the theme.
function choosePis(rng: Rng, candidate: Candidate, need: number, seeds: PerformanceIndicator[]) {
  const seeded = seeds.filter((pi) => candidate.pis.some((item) => item.code === pi.code)).slice(0, need);
  const rest = shuffled(rng, candidate.pis.filter((pi) => !seeded.some((seed) => seed.code === pi.code)));
  return [...seeded, ...rest].slice(0, need).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

function weightedPick(rng: Rng, candidates: Candidate[], event: EventOption) {
  const focus = FOCUS_AREAS[event.id] ?? [];
  const weights = candidates.map((candidate) => (focus.includes(candidate.theme.area) ? 4 : 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let index = 0; index < candidates.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return candidates[index];
  }
  return candidates[candidates.length - 1];
}

function judgeLine(judge: { full: string; first: string; role: string }, biz: Business, difficulty: RoleplayRequest["difficulty"], objection: string, concern: string) {
  const who = CLIENT_ROLES.has(judge.role) ? `${judge.full} (judge) is the ${judge.role}.` : `${judge.full} (judge) is ${biz.nameOwn} ${judge.role}.`;
  const manner =
    difficulty === "easy"
      ? `${judge.first} is friendly and open to your ideas.`
      : difficulty === "medium"
        ? `${judge.first} wants a recommendation that is backed by the numbers.`
        : `${judge.first} is skeptical and has already said, "${objection}"`;
  return `${who} ${manner} ${judge.first} will also ask ${concern}.`;
}

function write(rng: Rng, event: EventOption, request: RoleplayRequest, candidate: Candidate, pis: PerformanceIndicator[], biz: Business): ParticipantRoleplay {
  const format = eventFormat(event.id);
  const name = makeJudgeName(rng);
  const judge = { first: name.first, full: `${name.first} ${name.last}`, role: candidate.theme.judgeRoles ? pick(rng, candidate.theme.judgeRoles) : biz.ownerRole };
  const text = candidate.theme.write({ biz, rng, j: judge.first });
  const role = pick(rng, candidate.theme.roles);
  // Team events present as a pair.
  const intro =
    format.type === "team"
      ? `You and your partner each play the role of ${role} at ${biz.name}, ${biz.description}.`
      : `You are ${role} at ${biz.name}, ${biz.description}.`;

  const paragraphs = [
    `${intro} ${text.facts} ${text.problem}`,
    request.difficulty === "easy" ? null : request.difficulty === "medium" ? text.tradeoff : `${text.tradeoff} ${text.conflict}`,
    judgeLine(judge, biz, request.difficulty, text.objection, text.concern)
  ].filter((paragraph): paragraph is string => Boolean(paragraph));

  const tasks = request.difficulty === "easy" ? text.tasks.slice(0, 2) : [...text.tasks];

  return {
    id: crypto.randomUUID(),
    eventName: event.name,
    cluster: event.clusterLabel,
    instructionalArea: candidate.theme.area,
    participantInstructions: PARTICIPANT_INSTRUCTIONS,
    skills21stCentury: SKILLS_21ST_CENTURY,
    performanceIndicators: pis,
    // The task and meeting setting close the situation, so any packet view shows them.
    eventSituation: [...paragraphs, `Your task: ${tasks.join(" ")} You'll meet with ${judge.first} in ${biz.place}.`].join("\n\n"),
    caseTitle: `${biz.name}: ${candidate.theme.title}`,
    task: tasks,
    setting: `You'll meet with ${judge.first} in ${biz.place}.`,
    judge: { name: judge.full, role: judge.role, concern: text.concern },
    difficulty: request.difficulty,
    format: { pis: pis.length, prepMinutes: format.prepMinutes, presentMinutes: format.presentMinutes, typeLabel: format.typeLabel },
    caseHash: caseHash(biz.kind, candidate.theme.id),
    themeId: candidate.theme.id
  };
}

// Problems with a case that would make it unusable. Empty when it's fine.
export function validateCase(roleplay: ParticipantRoleplay, expectedPis: number): string[] {
  const problems: string[] = [];
  const everything = [roleplay.eventSituation, roleplay.caseTitle, roleplay.setting, ...(roleplay.task ?? []), roleplay.judge?.concern].join("\n");

  if (!roleplay.eventSituation?.trim()) problems.push("missing situation");
  if (!roleplay.caseTitle) problems.push("missing title");
  if (!roleplay.task || roleplay.task.length < 2 || roleplay.task.length > 3) problems.push("task list must have 2–3 items");
  if (!roleplay.setting) problems.push("missing meeting setting");
  if (!roleplay.judge?.name || !roleplay.judge.role || !roleplay.judge.concern) problems.push("missing judge");
  if (roleplay.performanceIndicators.length !== expectedPis) problems.push(`expected ${expectedPis} PIs, got ${roleplay.performanceIndicators.length}`);
  if (new Set(roleplay.performanceIndicators.map((pi) => pi.instructionalArea)).size > 1) problems.push("PIs from more than one area");
  if (everything.includes("..")) problems.push("double period");
  if (/[{}]/.test(everything)) problems.push("template token");
  if (/the current issue/i.test(everything)) problems.push("placeholder text");
  if (/undefined|NaN|\$-/.test(everything)) problems.push("broken value");
  // The PI list must not be pasted into the situation.
  if (roleplay.performanceIndicators.some((pi) => everything.includes(pi.text.replace(/\.$/, "")) || everything.includes(pi.code))) {
    problems.push("PI text pasted into the case");
  }
  if ((roleplay.eventSituation.match(/\d[\d,.]*/g) ?? []).length < 2) problems.push("not enough numbers");
  return problems;
}

export function writeCase(request: RoleplayRequest, options: CaseOptions = {}): ParticipantRoleplay {
  const rng = options.rng ?? makeRng();
  const event = getEventById(request.eventId);
  if (!event) throw new CaseError("That event wasn't found.");

  // The round's chosen PI count (3–7).
  const need = Math.min(7, Math.max(3, request.numberOfPis));
  let candidates = candidatesFor(event, need);
  const allPis = getPracticeOptions().performanceIndicators.filter((pi) => pi.eventIds.includes(event.id));
  let seeds: PerformanceIndicator[] = [];

  if (request.specificPerformanceIndicatorIds.length > 0) {
    // "Same PIs, new case": keep these PIs, write a different problem around them.
    seeds = request.specificPerformanceIndicatorIds
      .map((id) => allPis.find((pi) => pi.id === id))
      .filter((pi): pi is PerformanceIndicator => Boolean(pi));
    const codes = new Set(seeds.map((pi) => pi.code));
    const best = Math.max(0, ...candidates.map((candidate) => candidate.pis.filter((pi) => codes.has(pi.code)).length));
    if (best > 0) candidates = candidates.filter((candidate) => candidate.pis.filter((pi) => codes.has(pi.code)).length === best);
  } else if (options.weakCodes?.length) {
    // Weak PIs: build the case around the lowest-scoring PIs.
    const weak = options.weakCodes.map((code) => allPis.find((pi) => pi.code === code)).filter((pi): pi is PerformanceIndicator => Boolean(pi));
    for (const first of weak) {
      const withFirst = candidates.filter((candidate) => candidate.pis.some((pi) => pi.code === first.code));
      if (withFirst.length === 0) continue;
      const second = weak.find((pi) => pi.code !== first.code && withFirst.some((candidate) => candidate.pis.some((item) => item.code === pi.code)));
      seeds = second ? [first, second] : [first];
      candidates = second ? withFirst.filter((candidate) => candidate.pis.some((pi) => pi.code === second.code)) : withFirst;
      break;
    }
  } else if (request.instructionalAreaPreference.trim()) {
    const inArea = candidates.filter((candidate) => candidate.theme.area === request.instructionalAreaPreference.trim());
    if (inArea.length) candidates = inArea;
  }

  if (candidates.length === 0) throw new CaseError("No case fits this event yet. Try another event.");

  // Avoid the user's recent cases where possible.
  let fallback: ParticipantRoleplay | null = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = weightedPick(rng, candidates, event);
    const biz = makeBusiness(rng, candidate.families, request.industry);
    const roleplay = write(rng, event, request, candidate, choosePis(rng, candidate, need, seeds), biz);
    fallback ??= roleplay;
    if (!options.seenHashes?.has(roleplay.caseHash!)) return roleplay;
  }
  return fallback!;
}

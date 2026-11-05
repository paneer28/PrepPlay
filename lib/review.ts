import type { TestOptionKey } from "@/types";

// Spaced review: questions someone misses come back until they've got them.
// Safe to import from client components.
//
// The schedule isn't stored anywhere; it's worked out from the answer history
// (every saved test, custom session and unlimited session, oldest first):
//   - A miss makes the question due again right away. Unlimited mode brings it
//     back a few questions later in the same session.
//   - Each correct answer after a miss pushes it further out: about 1, 3, 7, 16,
//     then 35 days. The more times it's been missed, the shorter those gaps get.
//   - A miss at any point starts that climb over.
//   - Questions answered correctly the first time aren't scheduled at all.

export type ReviewEvent = { ref: string; correct: boolean; at: number };

export type ReviewCard = {
  ref: string;
  seen: number;
  lapses: number;
  // Correct answers in a row since the last miss.
  streak: number;
  lastAt: number;
  // When it should come back; null when it doesn't need reviewing.
  dueAt: number | null;
};

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const STEP_DAYS = [1, 3, 7, 16, 35, 75];

// Days until the next review after `streak` correct answers in a row, shrunk
// for questions that have been missed several times (never below ~8 hours).
export function reviewIntervalDays(streak: number, lapses: number) {
  const base = STEP_DAYS[Math.min(Math.max(streak, 1), STEP_DAYS.length) - 1];
  const shrink = Math.max(0.35, 1 / (1 + 0.3 * Math.max(0, lapses - 1)));
  return Math.max(1 / 3, base * shrink);
}

export function buildReviewCards(events: ReviewEvent[]): Map<string, ReviewCard> {
  const cards = new Map<string, ReviewCard>();
  const ordered = [...events].sort((left, right) => left.at - right.at);

  for (const event of ordered) {
    const card = cards.get(event.ref) ?? { ref: event.ref, seen: 0, lapses: 0, streak: 0, lastAt: event.at, dueAt: null };
    card.seen += 1;
    card.lastAt = event.at;

    if (!event.correct) {
      card.lapses += 1;
      card.streak = 0;
      card.dueAt = event.at;
    } else {
      card.streak += 1;
      card.dueAt = card.lapses > 0 ? event.at + reviewIntervalDays(card.streak, card.lapses) * DAY : null;
    }

    cards.set(event.ref, card);
  }

  return cards;
}

// Due now, most overdue first; ties go to the most-missed.
export function dueCards(cards: Map<string, ReviewCard>, now = Date.now()) {
  return [...cards.values()]
    .filter((card) => card.dueAt !== null && card.dueAt <= now)
    .sort((left, right) => left.dueAt! - right.dueAt! || right.lapses - left.lapses);
}

// "tomorrow", "in 3 days", "in 8 hours": for telling people when a question returns.
export function describeReturn(card: ReviewCard, now = Date.now()) {
  if (card.dueAt === null) return null;
  const hours = Math.round((card.dueAt - now) / (60 * MINUTE));
  if (hours < 20) return `in ${Math.max(1, hours)} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  return days <= 1 ? "tomorrow" : `in ${days} days`;
}

// Signed-out visitors keep their history in this browser instead.
const LOCAL_LIMIT = 3000;

export function loadLocalReviewEvents(key: string): ReviewEvent[] {
  try {
    const events = JSON.parse(window.localStorage.getItem(key) ?? "[]") as ReviewEvent[];
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

export function appendLocalReviewEvent(key: string, event: ReviewEvent) {
  try {
    const events = [...loadLocalReviewEvents(key), event].slice(-LOCAL_LIMIT);
    window.localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // Storage unavailable: reviews still work within the session.
  }
}

const OPTION_ORDER: TestOptionKey[] = ["A", "B", "C", "D"];

// New positions for a question seen before, so its answer can't be remembered by
// where it sat: every option leaves its original slot, and the slot it had in
// `previous` (the last reshuffled showing). Each entry names the option in that slot.
export function reorderedOptions(previous?: TestOptionKey[], random: () => number = Math.random): TestOptionKey[] {
  let order = OPTION_ORDER;
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const copy = [...OPTION_ORDER];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    order = copy;
    if (copy.every((key, slot) => key !== OPTION_ORDER[slot] && key !== previous?.[slot])) break;
  }
  return order;
}

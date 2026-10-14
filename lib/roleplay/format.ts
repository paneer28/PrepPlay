// PI count and timing for each roleplay event, worked out from the event type.
// Safe to import from client components.

export type EventType = "principles" | "series" | "team";

export type EventFormat = {
  type: EventType;
  typeLabel: string;
  pis: number;
  prepMinutes: number;
  presentMinutes: number;
};

const FORMATS: Record<EventType, EventFormat> = {
  principles: { type: "principles", typeLabel: "Principles", pis: 4, prepMinutes: 10, presentMinutes: 10 },
  series: { type: "series", typeLabel: "Series", pis: 5, prepMinutes: 10, presentMinutes: 10 },
  team: { type: "team", typeLabel: "Team Decision Making", pis: 7, prepMinutes: 30, presentMinutes: 15 }
};

export function eventType(eventId: string): EventType {
  if (eventId.startsWith("principles-")) return "principles";
  if (eventId.endsWith("-team")) return "team";
  return "series";
}

export function eventFormat(eventId: string): EventFormat {
  return FORMATS[eventType(eventId)];
}

// "Principles · 4 PIs · 10 + 10 min"
export function formatSummary(eventId: string) {
  const format = eventFormat(eventId);
  return `${format.typeLabel} · ${format.pis} PIs · ${format.prepMinutes} + ${format.presentMinutes} min`;
}

export const DIFFICULTY_HELP = {
  easy: "One clear problem, friendly judge.",
  medium: "A real tradeoff with numbers to use.",
  hard: "Competing goals and a skeptical judge."
} as const;

// Weak PIs needs this many scored rounds to know what's weak.
export const WEAK_PI_MIN_ROUNDS = 3;

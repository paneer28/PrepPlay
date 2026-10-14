// Small random helpers for case writing. A seeded generator makes a case
// reproducible in checks; normal use seeds from Math.random.

export type Rng = () => number;

export function makeRng(seed = Math.floor(Math.random() * 2 ** 31)): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A whole number between min and max (inclusive), on a step.
export function int(rng: Rng, min: number, max: number, step = 1) {
  const count = Math.floor((max - min) / step);
  return min + Math.floor(rng() * (count + 1)) * step;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function count(value: number) {
  return value.toLocaleString("en-US");
}

// Rounds to a tidy figure for prose: $412,000 rather than $411,873.
export function tidy(value: number) {
  const step = value >= 1_000_000 ? 10_000 : value >= 100_000 ? 1_000 : value >= 10_000 ? 500 : value >= 1_000 ? 50 : 5;
  return Math.max(step, Math.round(value / step) * step);
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MONTHS = ["March", "April", "May", "June", "August", "September", "October", "November"];

export function weekday(rng: Rng) {
  return pick(rng, WEEKDAYS);
}

export function month(rng: Rng) {
  return pick(rng, MONTHS);
}

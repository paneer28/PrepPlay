// The one colour scale used across the Tests dashboard. The number is always
// shown alongside, so colour is never the only signal.

export type ScoreBand = "great" | "good" | "fair" | "low";

export const SCORE_BANDS: Array<{ band: ScoreBand; label: string; min: number }> = [
  { band: "great", label: "90–100%", min: 90 },
  { band: "good", label: "75–89%", min: 75 },
  { band: "fair", label: "60–74%", min: 60 },
  { band: "low", label: "Below 60%", min: 0 }
];

export function percentOf(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function scoreBand(percent: number): ScoreBand {
  return percent >= 90 ? "great" : percent >= 75 ? "good" : percent >= 60 ? "fair" : "low";
}

// Design system v2: one continuous red-to-green scale for bars, through a warm
// orange midpoint so the middle doesn't turn muddy. 40% and below is fully
// "wrong", 90% and above fully "correct". Numbers always sit next to it.
export function scoreColor(percent: number) {
  const t = Math.min(1, Math.max(0, (percent - 40) / 50));
  if (t <= 0.5) return `color-mix(in oklch, var(--scale-mid) ${Math.round(t * 200)}%, var(--wrong))`;
  return `color-mix(in oklch, var(--correct) ${Math.round((t - 0.5) * 200)}%, var(--scale-mid))`;
}

// A light cell background on the same scale (text stays Ink, so contrast holds
// in both themes).
export function scoreTint(percent: number) {
  return `color-mix(in oklch, ${scoreColor(percent)} 24%, var(--page))`;
}

// Representative values for a legend of the four score bands.
export const SCORE_BAND_SAMPLES: Record<ScoreBand, number> = { great: 95, good: 82, fair: 67, low: 40 };

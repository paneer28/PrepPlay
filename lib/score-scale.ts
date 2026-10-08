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

// Soft tint + readable text for cells, pills, and squares.
export const BAND_STYLES: Record<ScoreBand, { cell: string; bar: string; text: string }> = {
  great: { cell: "border-green-200 bg-green-50 text-green-800", bar: "bg-green-500", text: "text-green-700" },
  good: { cell: "border-yellow-200 bg-yellow-50 text-yellow-800", bar: "bg-yellow-400", text: "text-yellow-700" },
  fair: { cell: "border-orange-200 bg-orange-50 text-orange-800", bar: "bg-orange-400", text: "text-orange-700" },
  low: { cell: "border-red-200 bg-red-50 text-red-800", bar: "bg-red-400", text: "text-red-700" }
};

export function bandStyle(percent: number) {
  return BAND_STYLES[scoreBand(percent)];
}

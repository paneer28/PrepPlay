import type { PracticeTestSummary } from "@/types";

// "2024 · ICDC", "2024", "ICDC", or "" when both are missing.
export function formatTestMeta(test: Pick<PracticeTestSummary, "year" | "event">) {
  return [test.year, test.event].filter(Boolean).join(" · ");
}

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

// Pooled questions are addressed as "<testId>#<number>" (custom practice sessions).
export function questionRef(testId: string, number: number) {
  return `${testId}#${number}`;
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { AchievementBadge, type AchievementKind } from "@/components/ds/Achievement";
import { activeDays, localDayKey } from "@/lib/streak";

const noop = () => () => {};

// Longest run of consecutive practice days, in the viewer's timezone.
function longestStreak(timestamps: string[]) {
  const days = activeDays(timestamps);
  let best = 0;
  for (const key of days) {
    const [year, month, day] = key.split("-").map(Number);
    const previous = new Date(year, month - 1, day - 1);
    if (days.has(localDayKey(previous))) continue; // not the start of a run
    let length = 0;
    const cursor = new Date(year, month - 1, day);
    while (days.has(localDayKey(cursor))) {
      length += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    best = Math.max(best, length);
  }
  return best;
}

// Milestone badges from all-time results.
export function Achievements({
  fullTests,
  testsCompleted,
  bestFullPercent,
  timestamps
}: {
  fullTests: number;
  testsCompleted: number;
  bestFullPercent: number | null;
  timestamps: string[];
}) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const weekStreak = useMemo(() => (isClient ? longestStreak(timestamps) >= 7 : false), [isClient, timestamps]);

  const badges: Array<{ kind: AchievementKind; earned: boolean }> = [
    { kind: "first-test", earned: fullTests >= 1 },
    { kind: "ten-tests", earned: testsCompleted >= 10 },
    { kind: "high-score", earned: (bestFullPercent ?? 0) >= 90 },
    { kind: "week-streak", earned: weekStreak }
  ];
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <section aria-labelledby="achievements-title" className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="achievements-title" className="font-display text-h3 font-extrabold text-fg">
          Achievements
        </h2>
        <p className="text-small font-bold text-fg-muted tabular-nums">
          {earned} of {badges.length} earned
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 justify-items-center gap-6 sm:flex sm:flex-wrap sm:justify-start sm:gap-8">
        {badges.map((badge) => (
          <AchievementBadge key={badge.kind} kind={badge.kind} earned={badge.earned} />
        ))}
      </div>
    </section>
  );
}

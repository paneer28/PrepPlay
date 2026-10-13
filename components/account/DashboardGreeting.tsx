"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ActivityStrip, StreakCounter } from "@/components/ds/Streak";
import { activeDays, currentWeek, streakLength } from "@/lib/streak";

const noop = () => () => {};

// "Welcome back" with the streak and this week's practice days. Days are worked
// out in the viewer's own timezone, so they fill in after hydration.
export function DashboardGreeting({ timestamps }: { timestamps: string[] }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const { streak, week } = useMemo(() => {
    const days = activeDays(timestamps);
    return { streak: isClient ? streakLength(days) : 0, week: isClient ? currentWeek(days) : null };
  }, [isClient, timestamps]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Welcome back</h1>
        <p className="text-fg">Review your saved roleplays and practice tests, see how often you practice, and check your scores.</p>
      </div>
      <div className={`flex flex-wrap items-end gap-5 ${isClient ? "" : "invisible"}`}>
        <div className="space-y-1.5">
          <StreakCounter days={streak} />
          <p className="text-label font-bold text-fg-muted">{streak === 1 ? "1-day streak" : `${streak}-day streak`}</p>
        </div>
        {week ? <ActivityStrip days={week} /> : <div className="h-[58px] w-[268px]" />}
      </div>
    </div>
  );
}

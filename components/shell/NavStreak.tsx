"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { StreakCounter } from "@/components/ds/Streak";
import { activeDays, streakLength } from "@/lib/streak";

const noop = () => () => {};

// Days depend on the viewer's timezone, so the number is filled in after
// hydration; the server renders an invisible placeholder of the same size.
export function NavStreak({ timestamps }: { timestamps: string[] }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const days = useMemo(() => (isClient ? streakLength(activeDays(timestamps)) : 0), [isClient, timestamps]);

  return (
    <Link href="/account" aria-label={`${days}-day streak. Open your dashboard`} className={`rounded-full ${isClient ? "" : "invisible"}`}>
      <StreakCounter days={days} className="min-h-8 px-2.5 text-[17px]" />
    </Link>
  );
}

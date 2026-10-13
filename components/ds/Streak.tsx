import { FlameIcon } from "@phosphor-icons/react/dist/ssr";

// Consecutive days with at least one completed test or roleplay.
export function StreakCounter({ days, className = "" }: { days: number; className?: string }) {
  const active = days > 0;
  return (
    <span
      className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3 font-display text-h4 font-extrabold tabular-nums ${
        active ? "bg-streak-tint text-streak-text" : "bg-surface text-fg-muted"
      } ${className}`}
      aria-label={`${days}-day streak`}
      title={`${days}-day streak`}
    >
      <FlameIcon size={22} weight="fill" aria-hidden="true" className={active ? "text-streak" : "text-fg-muted"} />
      <span aria-hidden="true">{days}</span>
    </span>
  );
}

export type ActivityDay = { label: string; date: string; active: boolean; today?: boolean };

// Seven small squares, filled on days with practice.
export function ActivityStrip({ days, className = "" }: { days: ActivityDay[]; className?: string }) {
  return (
    <ol className={`flex gap-2 ${className}`} aria-label="Practice this week">
      {days.map((day) => (
        <li key={day.date} className="flex flex-col items-center gap-1.5">
          <span
            className={`block h-8 w-8 rounded-lg border-[1.5px] ${
              day.active ? "border-streak-edge bg-streak shadow-[0_2px_0_var(--streak-edge)]" : "border-rule bg-surface"
            } ${day.today ? "outline-[2.5px] outline-offset-2 outline-brand outline" : ""}`}
            aria-hidden="true"
          />
          <span className={`text-label font-bold ${day.today ? "text-fg" : "text-fg-muted"}`}>
            <span aria-hidden="true">{day.label}</span>
            <span className="sr-only">
              {day.date}: {day.active ? "practised" : "no practice"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

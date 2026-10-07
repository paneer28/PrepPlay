type TestProgressBarProps = {
  value: number;
  max: number;
  tone?: "accent" | "good" | "warn" | "bad";
  label: string;
};

const TONE_CLASSES: Record<NonNullable<TestProgressBarProps["tone"]>, string> = {
  accent: "bg-[linear-gradient(135deg,#2563eb,#38bdf8)]",
  good: "bg-green-500",
  warn: "bg-amber-400",
  bad: "bg-red-400"
};

export function TestProgressBar({ value, max, tone = "accent", label }: TestProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-line/70"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${TONE_CLASSES[tone]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

type Props = {
  value: number; // 0–1
  label: string; // accessible name, e.g. "Test progress"
  tone?: "brand" | "correct" | "streak";
  className?: string;
};

const FILL = { brand: "bg-brand", correct: "bg-correct", streak: "bg-streak" };

export function ProgressBar({ value, label, tone = "brand", className = "" }: Props) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`h-4 w-full overflow-hidden rounded-full bg-track ${className}`}
    >
      <div
        className={`relative h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-reduce:transition-none ${FILL[tone]}`}
        style={{ width: clamped === 0 ? 0 : `max(${percent}%, 16px)` }}
      >
        {/* Glossy highlight along the top third. */}
        <span aria-hidden="true" className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/35" />
      </div>
    </div>
  );
}

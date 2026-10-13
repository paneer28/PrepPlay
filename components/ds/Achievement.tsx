import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";

export type AchievementKind = "first-test" | "ten-tests" | "high-score" | "week-streak";

export const ACHIEVEMENTS: Record<AchievementKind, { title: string; description: string }> = {
  "first-test": { title: "First full test", description: "Finish a full practice test" },
  "ten-tests": { title: "Ten tests", description: "Finish 10 practice tests" },
  "high-score": { title: "90% club", description: "Score 90% or higher on a test" },
  "week-streak": { title: "Week-long streak", description: "Practise 7 days in a row" }
};

function Art({ kind }: { kind: AchievementKind }) {
  switch (kind) {
    case "first-test":
      return (
        <>
          <circle cx="36" cy="36" r="32" className="fill-brand-tint" />
          <rect x="24" y="16" width="4.5" height="40" rx="2.25" className="fill-brand-edge" />
          <path d="M28 18h22l-5 8 5 8H28z" className="fill-brand" />
        </>
      );
    case "ten-tests":
      return (
        <>
          <path d="M36 4l27.7 16v32L36 68 8.3 52V20z" className="fill-brand" />
          <path d="M36 12l20.8 12v24L36 60 15.2 48V24z" className="fill-brand-edge" />
          <text x="36" y="44" textAnchor="middle" className="fill-white font-display" fontSize="22" fontWeight="800">
            10
          </text>
        </>
      );
    case "high-score":
      return (
        <>
          <circle cx="36" cy="36" r="32" className="fill-correct-tint" />
          <circle cx="36" cy="36" r="24" className="fill-correct" />
          <circle cx="36" cy="36" r="16" className="fill-white" />
          <circle cx="36" cy="36" r="8" className="fill-correct" />
          <path d="M36 36L58 14" strokeWidth="4" strokeLinecap="round" className="stroke-fg" />
          <path d="M52 12h8v8z" className="fill-fg" />
        </>
      );
    case "week-streak":
      return (
        <>
          <circle cx="36" cy="36" r="32" className="fill-streak-tint" />
          <path
            d="M36 12c8 7 16 15 16 27a16 16 0 0 1-32 0c0-6 2-10 5-14 1 4 3 7 6 8-1-8 1-15 5-21z"
            className="fill-streak"
          />
          <path d="M36 34c4 3 7 6 7 10a7 7 0 0 1-14 0c0-4 3-7 7-10z" className="fill-streak-edge" />
        </>
      );
  }
}

export function AchievementBadge({ kind, earned, className = "" }: { kind: AchievementKind; earned: boolean; className?: string }) {
  const { title, description } = ACHIEVEMENTS[kind];

  return (
    <figure className={`flex w-28 flex-col items-center gap-2 text-center ${className}`}>
      <span className="relative">
        <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" className={earned ? "" : "opacity-40 grayscale"}>
          <Art kind={kind} />
        </svg>
        {earned ? null : (
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-rule bg-page text-fg-muted">
            <LockSimpleIcon size={14} weight="bold" aria-hidden="true" />
          </span>
        )}
      </span>
      <figcaption>
        <span className="block text-label font-extrabold text-fg">{title}</span>
        <span className="block text-label font-semibold text-fg-muted">{earned ? "Earned" : description}</span>
      </figcaption>
    </figure>
  );
}

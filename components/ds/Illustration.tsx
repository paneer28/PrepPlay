// Flat geometric illustrations in the system palette. No mascots.
export type IllustrationKind = "trophy" | "target" | "chart" | "empty";

export function Illustration({ kind, size = 160, className = "" }: { kind: IllustrationKind; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} aria-hidden="true" className={className}>
      {kind === "trophy" ? (
        <>
          <circle cx="80" cy="80" r="72" className="fill-streak-tint" />
          <path d="M52 34h56v26a28 28 0 0 1-56 0z" className="fill-streak" />
          <path d="M52 42H38a14 14 0 0 0 14 22M108 42h14a14 14 0 0 1-14 22" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-streak-edge" />
          <rect x="72" y="86" width="16" height="20" className="fill-streak-edge" />
          <rect x="54" y="104" width="52" height="16" rx="5" className="fill-brand" />
          <rect x="62" y="120" width="36" height="6" rx="3" className="fill-brand-edge" />
          <path d="M66 46l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" className="fill-white" transform="translate(14 -2)" />
        </>
      ) : null}
      {kind === "target" ? (
        <>
          <circle cx="80" cy="80" r="72" className="fill-brand-tint" />
          <circle cx="76" cy="84" r="46" className="fill-wrong" />
          <circle cx="76" cy="84" r="34" className="fill-white" />
          <circle cx="76" cy="84" r="22" className="fill-wrong" />
          <circle cx="76" cy="84" r="10" className="fill-white" />
          <path d="M76 84l42-42" strokeWidth="7" strokeLinecap="round" className="stroke-brand-edge" />
          <path d="M112 30l14-4-4 14-8 4z" className="fill-brand" />
        </>
      ) : null}
      {kind === "chart" ? (
        <>
          <circle cx="80" cy="80" r="72" className="fill-surface" />
          <rect x="36" y="88" width="18" height="34" rx="5" className="fill-wrong" />
          <rect x="62" y="68" width="18" height="54" rx="5" className="fill-streak" />
          <rect x="88" y="50" width="18" height="72" rx="5" className="fill-correct" />
          <rect x="114" y="36" width="18" height="86" rx="5" className="fill-brand" />
          <rect x="28" y="122" width="112" height="6" rx="3" className="fill-rule-strong" />
        </>
      ) : null}
      {kind === "empty" ? (
        <>
          <circle cx="80" cy="80" r="72" className="fill-surface" />
          <rect x="34" y="44" width="70" height="84" rx="10" className="fill-page stroke-rule-strong" strokeWidth="4" />
          <rect x="46" y="60" width="46" height="7" rx="3.5" className="fill-rule-strong" />
          <rect x="46" y="76" width="34" height="7" rx="3.5" className="fill-rule" />
          <rect x="46" y="92" width="40" height="7" rx="3.5" className="fill-rule" />
          <circle cx="104" cy="98" r="20" className="fill-brand-tint stroke-brand" strokeWidth="6" />
          <path d="M118 112l14 14" strokeWidth="8" strokeLinecap="round" className="stroke-brand" />
        </>
      ) : null}
    </svg>
  );
}

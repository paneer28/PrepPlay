import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

// A tilted gold "sticker" for an honour, e.g. "Top 20 ICDC".
export function AchievementSticker({
  children,
  tilt = "left",
  size = "md",
  className = ""
}: {
  children: ReactNode;
  tilt?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex ${tilt === "left" ? "-rotate-3" : "rotate-3"} items-center gap-1.5 whitespace-nowrap rounded-[10px] border-[1.5px] border-streak bg-streak-tint font-display font-extrabold text-streak-text shadow-[0_3px_0_var(--streak-edge)] ${
        size === "sm" ? "px-2 py-0.5 text-label" : "px-2.5 py-1 text-small"
      } ${className}`}
    >
      <TrophyIcon size={size === "sm" ? 13 : 16} weight="fill" aria-hidden="true" className="text-streak" />
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import { areaStyle } from "@/lib/area-colors";

export type TagTone = "neutral" | "brand" | "correct" | "wrong" | "streak";

// Only for real labels: cluster, level, year, status.
export function Tag({ tone = "neutral", icon, children, className = "" }: { tone?: TagTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`tag ${className}`} data-tone={tone}>
      {icon}
      {children}
    </span>
  );
}

export function AreaTag({ area, className = "" }: { area: string; className?: string }) {
  return (
    <span className={`tag ${className}`} data-tone="area" style={areaStyle(area)}>
      {area}
    </span>
  );
}

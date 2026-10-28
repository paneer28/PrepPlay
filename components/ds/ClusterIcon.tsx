"use client";

import {
  AirplaneTiltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingsIcon,
  ChartLineUpIcon,
  MegaphoneIcon,
  PiggyBankIcon,
  RocketLaunchIcon,
  type Icon
} from "@phosphor-icons/react";
import type { CSSProperties } from "react";

// A soft hue and an icon per DECA cluster (decoration for recognition only; the
// cluster name is always written next to it).
const CLUSTERS: Record<string, { icon: Icon; hue: number }> = {
  Marketing: { icon: MegaphoneIcon, hue: 25 },
  "Business Management and Administration": { icon: BriefcaseIcon, hue: 245 },
  "Business Administration Core": { icon: BuildingsIcon, hue: 185 },
  Entrepreneurship: { icon: RocketLaunchIcon, hue: 340 },
  Finance: { icon: ChartLineUpIcon, hue: 125 },
  "Hospitality and Tourism": { icon: AirplaneTiltIcon, hue: 205 },
  "Personal Financial Literacy": { icon: PiggyBankIcon, hue: 95 }
};

// The cluster's hue (for tags, dots and badges tinted to match its icon).
export function clusterHue(cluster: string) {
  return (CLUSTERS[cluster] ?? { hue: 60 }).hue;
}

export function ClusterIcon({ cluster, size = 44 }: { cluster: string; size?: number }) {
  const { icon: Glyph, hue } = CLUSTERS[cluster] ?? { icon: BookOpenIcon, hue: 60 };

  return (
    <span
      aria-hidden="true"
      className="tag grid shrink-0 place-items-center rounded-control p-0"
      data-tone="area"
      style={{ "--area-h": hue, width: size, height: size } as CSSProperties}
    >
      <Glyph size={Math.round(size * 0.5)} weight="bold" />
    </span>
  );
}

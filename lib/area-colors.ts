import type { CSSProperties } from "react";

// Instructional areas get a stable hue for charts and tags (never buttons).
// Known areas are spread around the colour wheel by stepping 7 slots at a time
// through 25 slots, so areas that sort next to each other don't look alike.
export const KNOWN_AREAS = [
  "Business Law",
  "Channel Management",
  "Communication Skills",
  "Customer Relations",
  "Economics",
  "Emotional Intelligence",
  "Entrepreneurship",
  "Financial Analysis",
  "Financial-Information Management",
  "Human Resources Management",
  "Information Management",
  "Knowledge Management",
  "Market Planning",
  "Marketing",
  "Marketing-Information Management",
  "Operations",
  "Pricing",
  "Product/Service Management",
  "Professional Development",
  "Project Management",
  "Promotion",
  "Quality Management",
  "Risk Management",
  "Selling",
  "Strategic Management"
] as const;

const SLOTS = 25;
const STEP = 7;

export function areaHue(area: string) {
  let index = (KNOWN_AREAS as readonly string[]).indexOf(area.trim());
  if (index === -1) {
    index = 0;
    for (const char of area) index = (index * 31 + char.charCodeAt(0)) % SLOTS;
  }
  return Math.round(((index * STEP) % SLOTS) * (360 / SLOTS) + 12) % 360;
}

// Spread onto an element that uses .tag[data-tone="area"] or .area-fill.
export function areaStyle(area: string) {
  return { "--area-h": areaHue(area) } as CSSProperties;
}

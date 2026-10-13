"use client";

import { SegmentedControl } from "@/components/ds/SegmentedControl";

const MODES = [
  { value: "full", href: "/tests", label: "Full test" },
  { value: "custom", href: "/tests/custom", label: "Custom practice" }
] as const;

type Mode = (typeof MODES)[number]["value"];

// Segmented control for switching between the two practice test modes.
export function TestModeSwitch({ active }: { active: Mode }) {
  return (
    <nav aria-label="Practice test mode" className="w-full sm:w-auto">
      <SegmentedControl<Mode> label="Practice test mode" value={active} items={[...MODES]} block className="sm:inline-flex sm:w-auto" />
    </nav>
  );
}

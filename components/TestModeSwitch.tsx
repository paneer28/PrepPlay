"use client";

import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";

type Mode = "full" | "custom";

// Segmented control for switching between the two practice modes: whole tests
// (or sets) and custom practice. `fullHref` overrides where "full" goes.
export function TestModeSwitch({ active, set = "deca", fullHref }: { active: Mode; set?: QuestionSet; fullHref?: string }) {
  const items: Array<{ value: Mode; href: string; label: string }> = [
    { value: "full", href: fullHref ?? SET_ROUTES[set].home, label: set === "original" ? "Full set" : "Full test" },
    { value: "custom", href: SET_ROUTES[set].custom, label: "Custom practice" }
  ];

  return (
    <nav aria-label="Practice mode" className="w-full sm:w-auto">
      <SegmentedControl<Mode> label="Practice mode" value={active} items={items} block className="sm:inline-flex sm:w-auto" />
    </nav>
  );
}

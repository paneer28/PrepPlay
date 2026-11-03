"use client";

import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";

type Mode = "full" | "custom" | "unlimited";

// The Exams tab's sub-tabs. Custom and Unlimited stay on whichever question set
// the student is in; `extra` holds that set's switch, when they have chapter access.
export function TestModeSwitch({ active, set = "deca", extra }: { active: Mode; set?: QuestionSet; extra?: ReactNode }) {
  const items: Array<{ value: Mode; href: string; label: string }> = [
    { value: "full", href: "/exams", label: "Tests" },
    { value: "custom", href: SET_ROUTES[set].custom, label: "Custom" },
    { value: "unlimited", href: SET_ROUTES[set].unlimited, label: "Infinite" }
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <nav aria-label="Exams" className="w-full sm:w-auto">
        <SegmentedControl<Mode> label="Exams" value={active} items={items} block className="sm:inline-flex sm:w-auto [&>a]:px-1.5 sm:[&>a]:px-4" />
      </nav>
      {extra}
    </div>
  );
}

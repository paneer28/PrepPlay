"use client";

import { SegmentedControl } from "@/components/ds/SegmentedControl";

export function LearnTabs({ active }: { active: "exam" | "roleplay" }) {
  return (
    <nav aria-label="Learn" className="w-full sm:w-auto">
      <SegmentedControl
        label="Learn"
        value={active}
        block
        className="sm:inline-flex sm:w-auto"
        items={[
          { value: "exam", href: "/learn", label: "Exam road" },
          { value: "roleplay", href: "/learn/roleplay", label: "Roleplay road" }
        ]}
      />
    </nav>
  );
}

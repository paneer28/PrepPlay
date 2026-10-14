"use client";

import { useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ds/SegmentedControl";

export type View = { id: string; label: string; content: ReactNode };

// Switches between views of one page. The tab bar only appears once there is
// more than one view; with a single view it renders that view and nothing else.
export function ViewSwitcher({ views, label }: { views: View[]; label: string }) {
  const [active, setActive] = useState(views[0]?.id);
  const current = views.find((view) => view.id === active) ?? views[0];

  return (
    <>
      {views.length > 1 ? (
        <nav aria-label={label} className="mb-8">
          <SegmentedControl label={label} value={current.id} onChange={setActive} items={views.map((view) => ({ value: view.id, label: view.label }))} />
        </nav>
      ) : null}
      {current?.content}
    </>
  );
}

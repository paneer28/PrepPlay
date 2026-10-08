"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCustomSessionLauncher } from "@/components/useCustomSessionLauncher";
import { newCustomSession } from "@/lib/test-progress";
import type { TimeRange } from "@/lib/date-range";
import type { NoteFilter } from "@/lib/test-results-shared";

const selectClass =
  "w-full min-w-0 truncate rounded-[1.1rem] border border-line bg-[#fcfdff] px-3.5 py-2 text-sm font-normal text-ink outline-none transition focus:border-accent";

// Filter dropdowns for the missed-questions list. Each change navigates, so the
// filtered list is fetched (and paginated) on the server.
export function MissedFilters({
  areas,
  tests,
  value,
  hrefs
}: {
  areas: string[];
  tests: Array<{ id: string; label: string }>;
  value: { area: string | null; test: string | null; note: NoteFilter };
  hrefs: { area: Record<string, string>; test: Record<string, string>; note: Record<string, string> };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string | undefined) => href && startTransition(() => router.push(href, { scroll: false }));

  return (
    <div className={`grid gap-3 sm:grid-cols-3 ${pending ? "opacity-60" : ""}`}>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">
        Instructional area
        <select className={selectClass} value={value.area ?? ""} onChange={(event) => go(hrefs.area[event.target.value])}>
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">
        Test
        <select className={selectClass} value={value.test ?? ""} onChange={(event) => go(hrefs.test[event.target.value])}>
          <option value="">All tests</option>
          {tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">
        Notes
        <select className={selectClass} value={value.note} onChange={(event) => go(hrefs.note[event.target.value])}>
          <option value="any">With or without a note</option>
          <option value="with">Has a note</option>
          <option value="without">No note</option>
        </select>
      </label>
    </div>
  );
}

// Starts a custom practice session from every missed question matching the filters.
export function PracticeMissedButton({
  range,
  filters,
  count
}: {
  range: TimeRange;
  filters: { area: string | null; test: string | null; note: NoteFilter };
  count: number;
}) {
  const { launch, dialog } = useCustomSessionLauncher();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const start = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/test-attempts/missed-refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range, ...filters })
      });
      const data = (await response.json()) as { refs?: string[] };
      if (!response.ok || !data.refs?.length) throw new Error();
      setState("idle");
      launch(newCustomSession(data.refs, "My missed questions"));
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={start}
        disabled={state === "loading" || count === 0}
        className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {state === "loading" ? "Building session…" : "Practice my missed questions"}
      </button>
      {state === "error" ? <span className="text-sm text-red-700">Couldn&apos;t start the session. Try again.</span> : null}
      {dialog}
    </div>
  );
}

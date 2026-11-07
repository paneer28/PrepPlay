"use client";

import { CaretDownIcon, FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ds/SegmentedControl";

type Option = { value: string; label: string; href: string };

// "Showing: All time · All questions". Opens a small panel (a bottom sheet on
// a phone) with the time and question-set filters every section follows.
export function FilterButton({
  range,
  set,
  rangeOptions,
  setOptions
}: {
  range: string;
  set: string;
  rangeOptions: Option[];
  setOptions: Option[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rangeLabel = rangeOptions.find((option) => option.value === range)?.label ?? "";
  const setLabel = setOptions.find((option) => option.value === set)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="btn btn-secondary max-w-full"
      >
        <FunnelSimpleIcon size={16} weight="bold" aria-hidden="true" className="shrink-0" />
        <span className="truncate">
          Showing: {rangeLabel} · {setLabel}
        </span>
        <CaretDownIcon size={14} weight="bold" aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />
          <div
            id={panelId}
            role="dialog"
            aria-label="Filter the dashboard"
            // Choosing a filter navigates; close as it does.
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
            className="fixed inset-x-0 bottom-0 z-40 space-y-5 rounded-t-card border-t-[1.5px] border-rule bg-page p-5 pb-8 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:mt-2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:rounded-card sm:border-[1.5px] sm:pb-5"
          >
            <div className="flex items-center justify-between gap-3 sm:hidden">
              <p className="font-display text-h4 font-extrabold text-fg">Filter the dashboard</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-control text-fg-muted hover:bg-surface hover:text-fg">
                <XIcon size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-1.5">
              <p className="text-label font-bold text-fg-muted">Time</p>
              <SegmentedControl label="Time range" value={range} scroll={false} block size="sm" items={rangeOptions} />
            </div>
            <div className="space-y-1.5">
              <p className="text-label font-bold text-fg-muted">Questions</p>
              <SegmentedControl label="Question set" value={set} scroll={false} block size="sm" items={setOptions} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";

// A dashboard card with a header that collapses its body, so the lower
// sections of the Tests tab don't turn the page into one long scroll.
export function DashboardSection({
  eyebrow,
  title,
  description,
  actions,
  defaultOpen = true,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="surface overflow-hidden">
      <div
        className={`flex flex-col gap-4 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7 ${
          open ? "border-b border-line/80" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="group flex flex-1 items-start gap-3 text-left"
        >
          <span
            aria-hidden
            className={`mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted transition group-hover:text-ink ${
              open ? "rotate-90" : ""
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7.5 4.5 13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="eyebrow block">{eyebrow}</span>
            <span className="mt-1.5 block text-2xl font-bold tracking-[-0.04em] text-ink">{title}</span>
            {description && open ? (
              <span className="mt-1.5 block max-w-2xl text-sm leading-6 text-muted">{description}</span>
            ) : null}
          </span>
        </button>
        {actions && open ? <div className="sm:pl-4">{actions}</div> : null}
      </div>
      <div id={bodyId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useId, useState, type ReactNode } from "react";
import { Collapse } from "@/components/ui/Collapse";

// A dashboard card with a header that collapses its body, so the lower
// sections of the Tests tab don't turn the page into one long scroll.
export function DashboardSection({
  title,
  description,
  actions,
  defaultOpen = true,
  children
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="overflow-hidden rounded-card border-[1.5px] border-rule bg-page">
      <div className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 ${open ? "border-b-[1.5px] border-rule" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="group flex flex-1 items-start gap-3 rounded-control text-left"
        >
          <span
            aria-hidden
            className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface text-fg-muted transition-transform group-hover:text-fg ${
              open ? "rotate-90" : ""
            }`}
          >
            <CaretRightIcon size={14} weight="bold" />
          </span>
          <span>
            <span className="block font-display text-h3 font-extrabold text-fg">{title}</span>
            {description && open ? <span className="mt-1 block max-w-2xl text-small text-fg-muted">{description}</span> : null}
          </span>
        </button>
        {actions && open ? <div className="sm:pl-4">{actions}</div> : null}
      </div>
      <Collapse open={open} id={bodyId}>
        {children}
      </Collapse>
    </section>
  );
}

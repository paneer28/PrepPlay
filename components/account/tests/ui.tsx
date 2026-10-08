import Link from "next/link";
import type { ReactNode } from "react";

// Small server-rendered pieces shared by the Tests tab sections.

export const pillActive =
  "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2 text-sm font-semibold text-white shadow-card";
export const pillIdle =
  "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-[#f8fbff] hover:text-ink";

export function PillLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={active ? "true" : undefined} className={active ? pillActive : pillIdle}>
      {children}
    </Link>
  );
}

// Same pattern as the saved-roleplays pager, in a compact form.
export function Pager({
  page,
  pageSize,
  total,
  noun,
  hrefFor
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  hrefFor: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const disabled = "pointer-events-none rounded-full border border-line bg-[#f3f6fb] px-4 py-2 text-sm font-semibold text-slate-400";
  const enabled = "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]";

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-line bg-[#f8fbff] px-5 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start}–{end} of {total} {noun} · Page {current} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link href={hrefFor(Math.max(1, current - 1))} scroll={false} aria-disabled={current === 1} className={current === 1 ? disabled : enabled}>
          Previous
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, current + 1))}
          scroll={false}
          aria-disabled={current === totalPages}
          className={current === totalPages ? disabled : enabled}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

export function formatShortDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }).format(new Date(value));
}

import { ButtonLink } from "@/components/ds/Button";

// Small server-rendered pieces shared by the Tests tab sections.

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

  return (
    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-small font-semibold text-fg-muted tabular-nums">
        Showing {start}–{end} of {total} {noun} · Page {current} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PagerLink href={hrefFor(Math.max(1, current - 1))} disabled={current === 1}>
          Previous
        </PagerLink>
        <PagerLink href={hrefFor(Math.min(totalPages, current + 1))} disabled={current === totalPages}>
          Next
        </PagerLink>
      </div>
    </div>
  );
}

function PagerLink({ href, disabled, children }: { href: string; disabled: boolean; children: string }) {
  return (
    <ButtonLink
      href={href}
      scroll={false}
      variant="secondary"
      size="sm"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={disabled ? "pointer-events-none" : ""}
    >
      {children}
    </ButtonLink>
  );
}

export function formatShortDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }).format(new Date(value));
}

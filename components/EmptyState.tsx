import Link from "next/link";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-blue-200 bg-[linear-gradient(180deg,#f8fbff,#f4f8ff)] px-8 py-16 text-center">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h4" />
        </svg>
      </div>
      <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted">{description}</p>
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-muted shadow-card">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Choose your setup above to generate a packet
        </div>
      </div>
    </div>
  );
}

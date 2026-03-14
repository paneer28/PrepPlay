export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.9rem] border border-dashed border-line bg-white px-8 py-12 text-center shadow-card">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accentSoft text-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d="M4 12h16" />
          <path d="M12 4v16" />
        </svg>
      </div>
      <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.6rem] border border-line bg-white px-5 py-4 text-sm text-muted shadow-card">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accentSoft">
        <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-accent" />
      </span>
      <span className="text-base font-medium leading-7 text-ink">{label}</span>
    </div>
  );
}

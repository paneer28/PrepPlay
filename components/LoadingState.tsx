export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-5 rounded-[1.6rem] border border-blue-100 bg-[linear-gradient(135deg,#f0f6ff,#f8fbff)] px-6 py-5 shadow-card">
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-card">
        <span className="absolute h-8 w-8 animate-spin-slow rounded-full border-2 border-line border-t-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent opacity-80" />
      </span>
      <div>
        <span className="text-base font-semibold text-ink">{label}</span>
        <div className="mt-1.5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

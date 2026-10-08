// Loading placeholders in the dashboard's card style.

function Bar({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-full bg-[#e8eef8] ${className}`} />;
}

export function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading test statistics">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="surface-soft p-6">
            <Bar className="h-3 w-24" />
            <Bar className="mt-4 h-9 w-20" />
            <Bar className="mt-4 h-3 w-36" />
          </div>
        ))}
      </div>
      <SectionSkeleton />
    </div>
  );
}

export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="surface overflow-hidden" aria-busy="true">
      <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-6 sm:p-7">
        <Bar className="h-3 w-20" />
        <Bar className="mt-3 h-6 w-56" />
      </div>
      <div className="space-y-3 p-6 sm:p-7">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-[1.2rem] border border-line bg-white px-4 py-3.5">
            <Bar className="h-3 w-1/3" />
            <Bar className="h-2 flex-1" />
            <Bar className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading placeholders in the dashboard's card style.

function Bar({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-full bg-track motion-reduce:animate-none ${className}`} />;
}

export function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading test statistics">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="card">
            <Bar className="h-9 w-20" />
            <Bar className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <SectionSkeleton />
    </div>
  );
}

export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border-[1.5px] border-rule" aria-busy="true">
      <div className="border-b-[1.5px] border-rule p-5 sm:p-6">
        <Bar className="h-6 w-56" />
      </div>
      <div className="divide-y-[1.5px] divide-rule px-5 sm:px-6">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <Bar className="h-3 w-1/3" />
            <Bar className="h-2 flex-1" />
            <Bar className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

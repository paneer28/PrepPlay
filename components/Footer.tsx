import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line/80 bg-white/70">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.8fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em] text-ink">PrepPlay</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Practice DECA roleplays with participant-first packets, structured judge-side evaluation,
            and a workflow designed for fast, repeatable prep.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Navigation</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
            <Link href="/#features" className="transition hover:text-ink">Features</Link>
            <Link href="/practice" className="transition hover:text-ink">Practice Workspace</Link>
            <Link href="/#top" className="transition hover:text-ink">Back to Top</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">Customize</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              Seed data: <code className="rounded bg-white px-1 py-0.5 text-ink">data/</code>
            </p>
            <p>
              Offline engine: <code className="rounded bg-white px-1 py-0.5 text-ink">lib/offline-engine.ts</code>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

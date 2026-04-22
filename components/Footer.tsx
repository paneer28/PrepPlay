import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line/60 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <p className="text-lg font-bold tracking-[-0.03em] text-ink">PrepPlay</p>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted">
              Practice DECA roleplays the right way — participant packet first, structured
              judge-side evaluation after you submit.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              All systems operational
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Product</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
              <Link href="/practice" className="transition hover:text-ink">Practice Workspace</Link>
              <Link href="/#workflow" className="transition hover:text-ink">How It Works</Link>
              <Link href="/#features" className="transition hover:text-ink">Features</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Navigate</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
              <Link href="/" className="transition hover:text-ink">Home</Link>
              <Link href="/about" className="transition hover:text-ink">About</Link>
              <Link href="/login" className="transition hover:text-ink">Log in</Link>
              <Link href="/#top" className="transition hover:text-ink">Back to Top</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Customize</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              <p>
                Seed data:{" "}
                <code className="rounded-md border border-line bg-white px-1.5 py-0.5 text-xs font-medium text-ink">
                  data/
                </code>
              </p>
              <p>
                Offline engine:{" "}
                <code className="rounded-md border border-line bg-white px-1.5 py-0.5 text-xs font-medium text-ink">
                  lib/offline-engine.ts
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} PrepPlay. Built for DECA competitors.
          </p>
          <p className="text-sm text-muted">Free to use. No account required.</p>
        </div>
      </div>
    </footer>
  );
}

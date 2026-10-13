import Link from "next/link";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { Logo } from "@/components/shell/Logo";

const linkClass = "text-small font-semibold text-fg transition-colors hover:text-brand-text";

export function Footer() {
  return (
    <footer data-site-footer className="border-t-[1.5px] border-rule bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <Logo height={32} />
            <p className="max-w-xs text-small text-fg">
              Practice DECA roleplays the right way — participant packet first, structured judge-side evaluation after you
              submit.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-label font-bold text-fg-muted">Product</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/practice" className={linkClass}>Practice Workspace</Link>
              <Link href="/tests" className={linkClass}>Practice Tests</Link>
              <Link href="/#workflow" className={linkClass}>How It Works</Link>
              <Link href="/#features" className={linkClass}>Features</Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-label font-bold text-fg-muted">Navigate</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/" className={linkClass}>Home</Link>
              <Link href="/about" className={linkClass}>About</Link>
              <Link href="/login" className={linkClass}>Log in</Link>
              <Link href="/#top" className={linkClass}>Back to Top</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t-[1.5px] border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-small text-fg-muted">
            <p>&copy; {new Date().getFullYear()} PrepPlay. Built for DECA competitors.</p>
            <p>Free to use. No account required.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-label font-bold text-fg-muted">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

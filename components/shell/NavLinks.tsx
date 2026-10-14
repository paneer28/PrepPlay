"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass =
  "rounded-control px-3 py-2 text-small font-bold text-fg-muted transition-colors hover:bg-surface hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg";

// Plain text links (the wordmark is the way home). The dashboard lives in the
// account menu and About in the footer. On phones only Practice questions stays:
// the Practice button covers the tests, and roleplays sit behind it.
export function NavLinks() {
  const pathname = usePathname();
  const current = (match: (path: string) => boolean) => (match(pathname) ? "page" : undefined);

  return (
    <>
      {/* Phones: the Practice button already goes to the tests. */}
      <Link href="/tests" aria-current={current((path) => path === "/tests" || path.startsWith("/tests/"))} className={`hidden sm:inline-flex ${linkClass}`}>
        Practice tests
      </Link>
      <Link
        href="/practice-questions"
        aria-current={current((path) => path === "/practice-questions" || path.startsWith("/practice-questions/"))}
        className={`inline-flex ${linkClass}`}
      >
        <span className="hidden lg:inline">Practice questions</span>
        <span className="lg:hidden">Questions</span>
      </Link>
      <Link href="/practice" aria-current={current((path) => path === "/practice")} className={`hidden md:inline-flex ${linkClass}`}>
        Roleplays
      </Link>
    </>
  );
}

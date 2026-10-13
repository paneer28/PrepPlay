"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass =
  "rounded-control px-3 py-2 text-small font-bold text-fg-muted transition-colors hover:bg-surface hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg";

// Plain text links (the wordmark is the way home). On phones only the test
// link stays; roleplays sit behind Practice, the dashboard and About behind the
// account menu (signed out, About stays visible).
export function NavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const current = (match: (path: string) => boolean) => (match(pathname) ? "page" : undefined);

  return (
    <>
      <Link href="/tests" aria-current={current((path) => path === "/tests" || path.startsWith("/tests/"))} className={`inline-flex ${linkClass}`}>
        <span className="hidden sm:inline">Practice tests</span>
        <span className="sm:hidden">Tests</span>
      </Link>
      <Link href="/practice" aria-current={current((path) => path === "/practice")} className={`hidden md:inline-flex ${linkClass}`}>
        Roleplays
      </Link>
      <Link href="/account" aria-current={current((path) => path === "/account" || path.startsWith("/account/"))} className={`hidden md:inline-flex ${linkClass}`}>
        Dashboard
      </Link>
      <Link href="/about" aria-current={current((path) => path === "/about")} className={`${signedIn ? "hidden sm:inline-flex" : "inline-flex"} ${linkClass}`}>
        About
      </Link>
    </>
  );
}

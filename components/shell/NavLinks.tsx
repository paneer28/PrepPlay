"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass =
  "rounded-control px-3 py-2 text-small font-bold text-fg-muted transition-colors hover:bg-surface hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg";

// Plain text links. On phones, signed-in viewers find About in the account menu.
export function NavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const current = (match: (path: string) => boolean) => (match(pathname) ? "page" : undefined);

  return (
    <>
      <Link href="/" aria-current={current((path) => path === "/")} className={`hidden sm:inline-flex ${linkClass}`}>
        Home
      </Link>
      <Link href="/about" aria-current={current((path) => path === "/about")} className={`${signedIn ? "hidden sm:inline-flex" : "inline-flex"} ${linkClass}`}>
        About
      </Link>
      <Link href="/tests" aria-current={current((path) => path === "/tests" || path.startsWith("/tests/"))} className={`inline-flex ${linkClass}`}>
        <span className="hidden sm:inline">Practice tests</span>
        <span className="sm:hidden">Tests</span>
      </Link>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/exams", label: "Exams" },
  { href: "/roleplays", label: "Roleplays" }
];

// Plain text links (the wordmark is the way home). The dashboard lives in the
// account menu and About in the footer. The current page is white and
// underlined; the others are grey.
export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-control px-2 text-small font-bold text-fg-muted underline-offset-[6px] transition-colors hover:text-fg aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:decoration-2 sm:px-3"
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

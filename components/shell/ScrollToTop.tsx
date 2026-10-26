"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Next.js only scrolls a new page's <main> into view, which leaves the header
// just above the screen when you navigate from low on a page (e.g. the footer).
// Jump to the very top instead, unless the link targets a section (#hash).
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

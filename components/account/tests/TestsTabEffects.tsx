"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { TIMEZONE_COOKIE } from "@/lib/date-range";
import { importLocalResults } from "@/lib/test-sync";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// Runs once when the Tests tab opens: tells the server the viewer's timezone
// (for "Today" / "This week" / "This month") and imports any finished results
// that were only kept in this browser. Refreshes the data if either changed it.
export function TestsTabEffects() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let changed = false;
    if (timeZone && decodeURIComponent(readCookie(TIMEZONE_COOKIE) ?? "") !== timeZone) {
      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      changed = true;
    }

    importLocalResults().then((imported) => {
      if (changed || imported > 0) router.refresh();
    });
  }, [router]);

  return null;
}

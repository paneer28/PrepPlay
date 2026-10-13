"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Screens already moved to the new design. Everything else renders inside a
// .legacy wrapper that keeps the old look (and stays light in dark mode) until
// it is migrated. Removed once every screen is done.
const MIGRATED: Array<(path: string) => boolean> = [
  (path) => path === "/styleguide",
  // Test runner (intro + question screen); results are wrapped in .legacy inside it.
  (path) => path.startsWith("/tests/") && path !== "/tests/custom"
];

export function ThemeBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const migrated = MIGRATED.some((match) => match(pathname));

  return <div className={`flex flex-1 flex-col ${migrated ? "" : "legacy"}`}>{children}</div>;
}

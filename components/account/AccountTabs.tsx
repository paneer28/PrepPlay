"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ACCOUNT_TAB_COOKIE, type AccountTab } from "@/lib/account-tabs";

const TABS: Array<{ value: AccountTab; label: string }> = [
  { value: "roleplays", label: "Roleplays" },
  { value: "tests", label: "Tests" }
];

// Segmented control in the same pill style as the "Sort history" buttons.
export function AccountTabs({ active }: { active: AccountTab }) {
  return (
    <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={`/account?tab=${tab.value}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-2.5 text-sm font-semibold text-white shadow-card"
                : "rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-[#f8fbff] hover:text-ink"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Remembers the last tab so /account reopens on it.
export function AccountTabMemory({ tab }: { tab: AccountTab }) {
  useEffect(() => {
    document.cookie = `${ACCOUNT_TAB_COOKIE}=${tab}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [tab]);

  return null;
}

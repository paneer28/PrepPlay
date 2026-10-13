"use client";

import { useEffect } from "react";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { ACCOUNT_TAB_COOKIE, type AccountTab } from "@/lib/account-tabs";

const TABS: Array<{ value: AccountTab; label: string; href: string }> = [
  { value: "roleplays", label: "Roleplays", href: "/account?tab=roleplays" },
  { value: "tests", label: "Tests", href: "/account?tab=tests" }
];

export function AccountTabs({ active }: { active: AccountTab }) {
  return (
    <nav aria-label="Dashboard sections">
      <SegmentedControl<AccountTab> label="Dashboard sections" value={active} items={TABS} />
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

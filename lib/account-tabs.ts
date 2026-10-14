export type AccountTab = "roleplays" | "tests" | "leaderboard";

export function isAccountTab(value: string | undefined): value is AccountTab {
  return value === "roleplays" || value === "tests" || value === "leaderboard";
}

// Remembers the last dashboard tab so /account reopens on it.
export const ACCOUNT_TAB_COOKIE = "prepplay_account_tab";

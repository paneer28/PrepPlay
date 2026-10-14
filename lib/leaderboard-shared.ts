// Shared by the Leaderboard tab's form and server code.

export type LeaderboardPeriod = "week" | "all";

// 3 to 20 characters: letters, numbers, spaces, dots, dashes and underscores,
// starting with a letter or number. Matches the check in
// supabase/migrations/2026-10-13-leaderboard.sql.
export const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]{2,19}$/;

export function normalizeDisplayName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

export function validDisplayName(name: string) {
  return DISPLAY_NAME_PATTERN.test(normalizeDisplayName(name));
}

export type SaveLeaderboardResult = "saved" | "taken" | "invalid" | "missing-name" | "unavailable" | "error";

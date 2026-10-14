import { createClient } from "@/lib/supabase/server";
import type { LeaderboardPeriod } from "@/lib/leaderboard-shared";
import type { Loaded } from "@/lib/test-results";

export type LeaderboardRow = { rank: number; display_name: string; questions: number; is_me: boolean };
export type LeaderboardStatus = { display_name: string | null; opted_in: boolean; week_questions: number; all_questions: number };

export const LEADERBOARD_LIMIT = 50;

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<Loaded<T>> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    // PGRST202 / 42P01 / 42703: the leaderboard migration hasn't been run yet.
    return { ok: false, reason: ["PGRST202", "42P01", "42703"].includes(error.code) ? "unavailable" : "error" };
  }
  return { ok: true, data: data as T };
}

export async function getLeaderboard(period: LeaderboardPeriod) {
  const result = await rpc<LeaderboardRow[]>("get_leaderboard", { p_period: period, p_limit: LEADERBOARD_LIMIT });
  if (!result.ok) return result;
  // bigint columns can arrive as strings.
  return { ok: true as const, data: (result.data ?? []).map((row) => ({ ...row, rank: Number(row.rank), questions: Number(row.questions) })) };
}

export async function getMyLeaderboardStatus(): Promise<Loaded<LeaderboardStatus>> {
  const result = await rpc<LeaderboardStatus[]>("get_my_leaderboard_status", {});
  if (!result.ok) return result;
  const row = result.data?.[0];
  return {
    ok: true,
    data: {
      display_name: row?.display_name ?? null,
      opted_in: Boolean(row?.opted_in),
      week_questions: Number(row?.week_questions ?? 0),
      all_questions: Number(row?.all_questions ?? 0)
    }
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { normalizeDisplayName, type SaveLeaderboardResult } from "@/lib/leaderboard-shared";
import { createClient } from "@/lib/supabase/server";

export async function saveLeaderboardProfile(displayName: string, optIn: boolean): Promise<SaveLeaderboardResult> {
  const supabase = await createClient();
  if (!supabase) return "unavailable";

  const { data, error } = await supabase.rpc("set_leaderboard_profile", {
    p_display_name: normalizeDisplayName(displayName).slice(0, 40),
    p_opt_in: optIn
  });

  if (error) return error.code === "PGRST202" ? "unavailable" : "error";
  if (data === "saved") revalidatePath("/account");
  return (["saved", "taken", "invalid", "missing-name"].includes(data) ? data : "error") as SaveLeaderboardResult;
}

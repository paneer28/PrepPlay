import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's username (the leaderboard display name). Null when profiles can't be read (e.g. the
// leaderboard migration hasn't been run), so nothing asks for a username then.
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;

  return { username: (data?.display_name as string | null) ?? null };
});

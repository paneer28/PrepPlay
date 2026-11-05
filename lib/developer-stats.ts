import { createClient } from "@/lib/supabase/server";

export type DeveloperUserStats = {
  id: string;
  email: string;
  display_name: string | null;
  deca_event: string | null;
  created_at: string;
  answered: number;
  correct: number;
  full_tests: number;
  custom_sessions: number;
  best_full_pct: number | null;
  roleplays_generated: number;
  roleplays_judged: number;
  flagged: number;
  last_active: string | null;
};

// Every user's totals. The database function refuses non-developers, whatever
// the caller checked. "unavailable": the migration hasn't been run yet.
export async function getDeveloperUserStats(): Promise<
  { ok: true; users: DeveloperUserStats[] } | { ok: false; reason: "unavailable" | "error" }
> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const { data, error } = await supabase.rpc("developer_user_stats");
  if (error) return { ok: false, reason: error.code === "PGRST202" || error.code === "42883" ? "unavailable" : "error" };
  return { ok: true, users: data as DeveloperUserStats[] };
}

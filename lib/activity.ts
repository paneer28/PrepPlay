import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Up to a year of activity is enough for any realistic streak.
const LOOKBACK_DAYS = 400;
const MAX_ROWS = 2000;

// Times the viewer finished something: submitted test attempts and judged
// roleplays. Days are worked out in the browser, in the viewer's own timezone.
export const getActivityTimestamps = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();
  const [tests, roleplays] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("submitted_at")
      .eq("user_id", userId)
      .gte("submitted_at", since)
      .order("submitted_at", { ascending: false })
      .limit(MAX_ROWS),
    supabase
      .from("generated_roleplays")
      .select("submitted_at")
      .eq("user_id", userId)
      .not("submitted_at", "is", null)
      .gte("submitted_at", since)
      .order("submitted_at", { ascending: false })
      .limit(MAX_ROWS)
  ]);

  // Either table may be unavailable (e.g. migration not run yet): just skip it.
  return [...(tests.data ?? []), ...(roleplays.data ?? [])]
    .map((row) => row.submitted_at as string | null)
    .filter((value): value is string => Boolean(value));
});

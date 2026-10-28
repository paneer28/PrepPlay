import { cache } from "react";
import { getViewer } from "@/lib/auth";
import { decaEventById } from "@/lib/deca-events";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's username (the leaderboard display name) and DECA event.
// Null when profiles can't be read (e.g. the leaderboard migration hasn't been
// run), so nothing asks for a username then. `eventSupported` is false until the
// deca_event migration has been run, so nothing asks for an event either.
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  if (!supabase) return null;

  // "*" so a missing deca_event column doesn't break the username prompt.
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) return null;

  return {
    username: (data?.display_name as string | null) ?? null,
    event: decaEventById(data?.deca_event as string | null),
    eventSupported: !data || "deca_event" in data
  };
});

// The signed-in user's event, for pages that start their filters on it.
export async function getViewerEvent() {
  const viewer = await getViewer();
  return viewer ? ((await getProfile(viewer.id))?.event ?? null) : null;
}

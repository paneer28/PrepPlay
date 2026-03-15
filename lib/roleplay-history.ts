import type { User } from "@supabase/supabase-js";
import type { ParticipantRoleplay, RoleplayRequest } from "@/types";
import { createClient } from "@/lib/supabase/server";

const MAX_HISTORY_ROWS = 400;

function normalizeForKey(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSituationKey(roleplay: ParticipantRoleplay) {
  const [setup = "", ask = ""] = roleplay.eventSituation.split("\n\n");

  return [roleplay.eventName, setup, ask].map(normalizeForKey).join("::").slice(0, 500);
}

export async function getAuthenticatedViewer() {
  const supabase = await createClient();

  if (!supabase) {
    return null as User | null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getSeenSituationKeys(userId: string, eventId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("generated_roleplays")
    .select("situation_key")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_ROWS);

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(data.map((row) => row.situation_key));
}

export async function saveGeneratedRoleplay(
  userId: string,
  request: RoleplayRequest,
  roleplay: ParticipantRoleplay,
  situationKey: string
) {
  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("generated_roleplays").insert({
    user_id: userId,
    event_id: request.eventId,
    situation_key: situationKey,
    payload: {
      request,
      roleplay
    }
  });

  if (error) {
    // If the database tables are not set up yet, keep guest/offline generation working.
    return;
  }
}

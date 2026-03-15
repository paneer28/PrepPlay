import type { User } from "@supabase/supabase-js";
import type {
  AccountStatistics,
  JudgeEvaluation,
  ParticipantRoleplay,
  RoleplayRequest,
  SavedRoleplayHistoryItem
} from "@/types";
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
    id: roleplay.id,
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

export async function saveJudgedRoleplay(
  userId: string,
  roleplayId: string,
  userResponse: string,
  evaluation: JudgeEvaluation
) {
  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("generated_roleplays")
    .update({
      response_text: userResponse,
      evaluation,
      submitted_at: new Date().toISOString()
    })
    .eq("id", roleplayId)
    .eq("user_id", userId);

  if (error) {
    return;
  }
}

type RawGeneratedRoleplayRow = {
  id: string;
  event_id: string;
  created_at: string;
  submitted_at: string | null;
  response_text: string | null;
  payload: {
    roleplay?: ParticipantRoleplay;
  } | null;
  evaluation: JudgeEvaluation | null;
};

function toHistoryItem(row: RawGeneratedRoleplayRow): SavedRoleplayHistoryItem | null {
  const roleplay = row.payload?.roleplay;

  if (!roleplay) {
    return null;
  }

  return {
    id: row.id,
    eventId: row.event_id,
    eventName: roleplay.eventName,
    cluster: roleplay.cluster,
    instructionalArea: roleplay.instructionalArea,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    estimatedTotalScore: row.evaluation?.estimatedTotalScore ?? null,
    responseText: row.response_text,
    eventSituation: roleplay.eventSituation
  };
}

export function buildAccountStatistics(history: SavedRoleplayHistoryItem[]): AccountStatistics {
  const submitted = history.filter((item) => item.submittedAt);
  const scores = submitted
    .map((item) => item.estimatedTotalScore)
    .filter((score): score is number => typeof score === "number");

  return {
    totalGenerated: history.length,
    totalSubmitted: submitted.length,
    averageScore:
      scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    uniqueEvents: new Set(history.map((item) => item.eventId)).size,
    uniqueClusters: new Set(history.map((item) => item.cluster)).size
  };
}

export async function getAccountHistory(userId: string, limit = 50) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as SavedRoleplayHistoryItem[];
  }

  const { data, error } = await supabase
    .from("generated_roleplays")
    .select("id, event_id, created_at, submitted_at, response_text, payload, evaluation")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [] as SavedRoleplayHistoryItem[];
  }

  return (data as RawGeneratedRoleplayRow[]).map(toHistoryItem).filter(Boolean) as SavedRoleplayHistoryItem[];
}

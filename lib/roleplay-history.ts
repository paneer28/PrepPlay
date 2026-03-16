import type { User } from "@supabase/supabase-js";
import type {
  AccountStatistics,
  JudgeEvaluation,
  ParticipantRoleplay,
  RoleplayRequest,
  SavedRoleplayHistoryItem
} from "@/types";
import { createClient } from "@/lib/supabase/server";

const MAX_HISTORY_ROWS = 2000;
const ACCOUNT_HISTORY_FETCH_BATCH = 1000;
export const ACCOUNT_HISTORY_PAGE_SIZE = 12;

export const ACCOUNT_HISTORY_SORTS = ["newest", "oldest", "score-high", "score-low"] as const;

export type AccountHistorySort = (typeof ACCOUNT_HISTORY_SORTS)[number];

function normalizeForKey(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSituationKey(roleplay: ParticipantRoleplay) {
  const [setup = "", ask = ""] = roleplay.eventSituation.split("\n\n");
  const financeSignature = roleplay.financialAnalysis
    ? [
        roleplay.financialAnalysis.caseType,
        roleplay.financialAnalysis.title,
        ...roleplay.financialAnalysis.inputs.map((input) => `${input.label} ${input.value}`)
      ].join(" ")
    : "";

  return [roleplay.eventName, setup, ask, financeSignature]
    .map(normalizeForKey)
    .join("::")
    .slice(0, 500);
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

async function fetchAllGeneratedRoleplayRows(userId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as RawGeneratedRoleplayRow[];
  }

  const rows: RawGeneratedRoleplayRow[] = [];
  let from = 0;

  while (rows.length < MAX_HISTORY_ROWS) {
    const to = Math.min(from + ACCOUNT_HISTORY_FETCH_BATCH - 1, MAX_HISTORY_ROWS - 1);
    const { data, error } = await supabase
      .from("generated_roleplays")
      .select("id, event_id, created_at, submitted_at, response_text, payload, evaluation")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data?.length) {
      break;
    }

    rows.push(...(data as RawGeneratedRoleplayRow[]));

    if (data.length < ACCOUNT_HISTORY_FETCH_BATCH) {
      break;
    }

    from += ACCOUNT_HISTORY_FETCH_BATCH;
  }

  return rows.slice(0, MAX_HISTORY_ROWS);
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

function createdAtValue(item: SavedRoleplayHistoryItem) {
  return new Date(item.createdAt).getTime();
}

function sortHistoryItems(history: SavedRoleplayHistoryItem[], sort: AccountHistorySort) {
  const sorted = [...history];

  switch (sort) {
    case "oldest":
      sorted.sort((left, right) => createdAtValue(left) - createdAtValue(right));
      break;
    case "score-high":
      sorted.sort((left, right) => {
        const leftHasScore = left.estimatedTotalScore !== null;
        const rightHasScore = right.estimatedTotalScore !== null;

        if (leftHasScore !== rightHasScore) {
          return leftHasScore ? -1 : 1;
        }

        const scoreDelta = (right.estimatedTotalScore ?? 0) - (left.estimatedTotalScore ?? 0);

        return scoreDelta !== 0 ? scoreDelta : createdAtValue(right) - createdAtValue(left);
      });
      break;
    case "score-low":
      sorted.sort((left, right) => {
        const leftHasScore = left.estimatedTotalScore !== null;
        const rightHasScore = right.estimatedTotalScore !== null;

        if (leftHasScore !== rightHasScore) {
          return leftHasScore ? -1 : 1;
        }

        const scoreDelta = (left.estimatedTotalScore ?? 0) - (right.estimatedTotalScore ?? 0);

        return scoreDelta !== 0 ? scoreDelta : createdAtValue(right) - createdAtValue(left);
      });
      break;
    case "newest":
    default:
      sorted.sort((left, right) => createdAtValue(right) - createdAtValue(left));
      break;
  }

  return sorted;
}

export function normalizeAccountHistorySort(value: string | undefined): AccountHistorySort {
  return ACCOUNT_HISTORY_SORTS.includes(value as AccountHistorySort)
    ? (value as AccountHistorySort)
    : "newest";
}

export function normalizeAccountHistoryPage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function getAccountHistoryPage(userId: string, page: number, sort: AccountHistorySort) {
  const rawRows = await fetchAllGeneratedRoleplayRows(userId);
  const fullHistory = rawRows.map(toHistoryItem).filter(Boolean) as SavedRoleplayHistoryItem[];
  const sortedHistory = sortHistoryItems(fullHistory, sort);
  const totalCount = sortedHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ACCOUNT_HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ACCOUNT_HISTORY_PAGE_SIZE;
  const endIndex = startIndex + ACCOUNT_HISTORY_PAGE_SIZE;

  return {
    history: sortedHistory.slice(startIndex, endIndex),
    totalCount,
    totalPages,
    currentPage,
    statistics: buildAccountStatistics(fullHistory)
  };
}

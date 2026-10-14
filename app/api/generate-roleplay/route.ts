import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildSituationKey, getAuthenticatedViewer, getSeenSituationKeys, saveGeneratedRoleplay } from "@/lib/roleplay-history";
import { roleplayRequestSchema } from "@/lib/schemas";
import { validateCase, writeCase } from "@/lib/roleplay/write-case";
import type { RoleplayRequest } from "@/types";

export const runtime = "nodejs";

const MAX_REPEAT_AVOIDANCE_ATTEMPTS = 12;

// Writes a case and checks it before it's shown; a failed check gets one more try.
function generateParticipantRoleplay(request: RoleplayRequest) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const roleplay = writeCase(request);
    if (validateCase(roleplay, request.numberOfPis).length === 0) return roleplay;
  }
  throw new Error("We couldn't put together a good case this time. Try again.");
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsedRequest = roleplayRequestSchema.parse(raw);
    const user = await getAuthenticatedViewer();
    const seenSituationKeys = user
      ? await getSeenSituationKeys(user.id, parsedRequest.eventId)
      : new Set<string>();

    let roleplay = generateParticipantRoleplay(parsedRequest);
    let situationKey = buildSituationKey(roleplay);

    if (user && seenSituationKeys.size > 0) {
      for (let attempt = 0; attempt < MAX_REPEAT_AVOIDANCE_ATTEMPTS; attempt += 1) {
        if (!seenSituationKeys.has(situationKey)) {
          break;
        }

        roleplay = generateParticipantRoleplay(parsedRequest);
        situationKey = buildSituationKey(roleplay);
      }
    }

    if (user) {
      await saveGeneratedRoleplay(user.id, parsedRequest, roleplay, situationKey);
    }

    return NextResponse.json(roleplay);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(" ") },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong while generating the roleplay.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

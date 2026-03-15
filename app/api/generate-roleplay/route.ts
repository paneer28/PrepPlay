import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildSituationKey, getAuthenticatedViewer, getSeenSituationKeys, saveGeneratedRoleplay } from "@/lib/roleplay-history";
import { roleplayRequestSchema } from "@/lib/schemas";
import { generateParticipantRoleplay } from "@/lib/offline-engine";

export const runtime = "nodejs";

const MAX_REPEAT_AVOIDANCE_ATTEMPTS = 12;

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

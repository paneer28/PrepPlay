import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthenticatedViewer, saveJudgedRoleplay } from "@/lib/roleplay-history";
import { judgeRequestSchema } from "@/lib/schemas";
import { judgeParticipantResponse } from "@/lib/offline-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsedRequest = judgeRequestSchema.parse(raw);
    const user = await getAuthenticatedViewer();
    const evaluation = judgeParticipantResponse(
      parsedRequest.request,
      parsedRequest.participantRoleplay,
      parsedRequest.userResponse
    );

    if (user) {
      await saveJudgedRoleplay(
        user.id,
        parsedRequest.participantRoleplay.id,
        parsedRequest.userResponse,
        evaluation
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(" ") },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong while judging the roleplay.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

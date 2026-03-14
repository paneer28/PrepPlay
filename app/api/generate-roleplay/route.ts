import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { roleplayRequestSchema } from "@/lib/schemas";
import { generateParticipantRoleplay } from "@/lib/offline-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsedRequest = roleplayRequestSchema.parse(raw);
    const roleplay = generateParticipantRoleplay(parsedRequest);

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

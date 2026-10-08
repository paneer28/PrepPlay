import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { NOTE_MAX_LENGTH } from "@/lib/test-results-shared";
import { saveAnswerNote } from "@/lib/test-results";

export const runtime = "nodejs";

const requestSchema = z.object({
  position: z.number().int().positive(),
  note: z.string().max(NOTE_MAX_LENGTH)
});

// Saves (or clears, when empty) the note on one answer of the signed-in user's attempt.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Unknown attempt." }, { status: 404 });
    }

    const { position, note } = requestSchema.parse(await request.json());
    const result = await saveAnswerNote(id, position, note);
    const status = { saved: 200, "not-found": 404, unavailable: 503, error: 500 }[result];

    return NextResponse.json({ status: result }, { status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save this note." }, { status: 500 });
  }
}

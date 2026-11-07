import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getQuestionNotes, saveQuestionNote } from "@/lib/question-notes";
import { NOTE_MAX_LENGTH } from "@/lib/test-results-shared";
import { canonicalRef } from "@/lib/tests";

export const runtime = "nodejs";

const refSchema = z.string().min(3).max(220);
const saveSchema = z.object({ ref: refSchema, note: z.string().max(NOTE_MAX_LENGTH) });
const lookupSchema = z.object({ refs: z.array(refSchema).max(500) });

function badRequest(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
  }
  return null;
}

// Saves (or clears, when empty) the signed-in user's note on one question.
export async function PUT(request: Request) {
  try {
    const { ref, note } = saveSchema.parse(await request.json());
    const result = await saveQuestionNote(ref, note);
    const status = { saved: 200, "signed-out": 401, unavailable: 503, error: 500 }[result];
    return NextResponse.json({ status: result }, { status });
  } catch (error) {
    return badRequest(error) ?? NextResponse.json({ error: "Could not save this note." }, { status: 500 });
  }
}

// The signed-in user's notes on these questions, keyed by the refs asked for.
export async function POST(request: Request) {
  try {
    const { refs } = lookupSchema.parse(await request.json());
    const result = await getQuestionNotes();
    if (!result.ok) return NextResponse.json({ error: "Notes aren't available." }, { status: 503 });

    const notes: Record<string, string> = {};
    for (const ref of refs) {
      const note = result.notes.get(canonicalRef(ref));
      if (note) notes[ref] = note;
    }
    return NextResponse.json({ notes });
  } catch (error) {
    return badRequest(error) ?? NextResponse.json({ error: "Could not load notes." }, { status: 500 });
  }
}

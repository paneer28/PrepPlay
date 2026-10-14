import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getQuestionsByRefs } from "@/lib/tests";

export const runtime = "nodejs";

const requestSchema = z.object({
  refs: z.array(z.string().max(300)).min(1).max(2000)
});

// Full question data for a custom session of PrepPlay's original questions. Open
// to everyone: refs to real DECA exams are skipped (those go through the
// access-code-protected /api/practice-questions).
export async function POST(request: Request) {
  try {
    const { refs } = requestSchema.parse(await request.json());

    return NextResponse.json({ questions: getQuestionsByRefs(refs, "original") });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }

    return NextResponse.json({ error: "Something went wrong while loading questions." }, { status: 500 });
  }
}

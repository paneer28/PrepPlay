import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getQuestionsByRefs } from "@/lib/tests";

export const runtime = "nodejs";

const requestSchema = z.object({
  refs: z.array(z.string().max(300)).min(1).max(10000)
});

// Returns full question data for a custom practice session, in the order requested.
export async function POST(request: Request) {
  try {
    const { refs } = requestSchema.parse(await request.json());

    return NextResponse.json({ questions: getQuestionsByRefs(refs) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(" ") },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Something went wrong while loading questions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

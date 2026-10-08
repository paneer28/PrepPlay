import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { saveAttemptUploads } from "@/lib/test-results";

export const runtime = "nodejs";

const optionKey = z.enum(["A", "B", "C", "D"]);

const uploadSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["full", "custom"]),
  testId: z.string().max(200).optional(),
  refs: z.array(z.string().max(300)).max(10000).optional(),
  filters: z
    .object({
      summary: z.string().max(500),
      selections: z.record(z.string(), z.array(z.string().max(300)).max(1000)).optional()
    })
    .optional(),
  answers: z.record(z.string().regex(/^\d+$/), optionKey),
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime(),
  elapsedSeconds: z.number().min(0).max(60 * 60 * 24 * 7).nullable(),
  timedOut: z.boolean()
});

const requestSchema = z.object({
  attempts: z.array(uploadSchema).min(1).max(50)
});

// Saves submitted tests and custom sessions to the signed-in account. Used on
// submit and when importing results that were only kept in the browser.
export async function POST(request: Request) {
  try {
    const { attempts } = requestSchema.parse(await request.json());
    const result = await saveAttemptUploads(attempts);
    const status = { saved: 200, "signed-out": 401, unavailable: 503, error: 500 }[result.status];

    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ status: "error", error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ status: "error", error: "Could not save this result." }, { status: 500 });
  }
}

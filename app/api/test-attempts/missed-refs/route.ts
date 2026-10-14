import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { normalizeTimezone, rangeBounds, TIME_RANGES, TIMEZONE_COOKIE } from "@/lib/date-range";
import { DASHBOARD_SETS, NOTE_FILTERS } from "@/lib/test-results-shared";
import { getMissedRefs } from "@/lib/test-results";
import { getTestById, isOriginal } from "@/lib/tests";

export const runtime = "nodejs";

const requestSchema = z.object({
  range: z.enum(TIME_RANGES),
  area: z.string().max(300).nullable(),
  test: z.string().max(200).nullable(),
  note: z.enum(NOTE_FILTERS),
  set: z.enum(DASHBOARD_SETS).default("all")
});

// Question refs for every missed question matching the dashboard filters, so
// the browser can start a custom practice session from them.
export async function POST(request: Request) {
  try {
    const { range, area, test, note, set } = requestSchema.parse(await request.json());
    const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
    const result = await getMissedRefs(rangeBounds(range, timeZone), { area, test, note }, set);

    if (!result.ok) {
      return NextResponse.json({ error: "Could not load your missed questions." }, { status: 503 });
    }
    // Only original questions: the session runs under /practice-questions (no
    // access code). Any real exam question: it runs under /tests.
    const allOriginal = result.data.every((ref) => isOriginal(getTestById(ref.split("#")[0])));
    return NextResponse.json({ refs: result.data, set: allOriginal ? "original" : "deca" });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not load your missed questions." }, { status: 500 });
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { normalizeTimezone, rangeBounds, TIME_RANGES, TIMEZONE_COOKIE } from "@/lib/date-range";
import { NOTE_FILTERS } from "@/lib/test-results-shared";
import { getMissedRefs } from "@/lib/test-results";

export const runtime = "nodejs";

const requestSchema = z.object({
  range: z.enum(TIME_RANGES),
  area: z.string().max(300).nullable(),
  test: z.string().max(200).nullable(),
  note: z.enum(NOTE_FILTERS)
});

// Question refs for every missed question matching the dashboard filters, so
// the browser can start a custom practice session from them.
export async function POST(request: Request) {
  try {
    const { range, area, test, note } = requestSchema.parse(await request.json());
    const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
    const result = await getMissedRefs(rangeBounds(range, timeZone), { area, test, note });

    if (!result.ok) {
      return NextResponse.json({ error: "Could not load your missed questions." }, { status: 503 });
    }
    return NextResponse.json({ refs: result.data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not load your missed questions." }, { status: 500 });
  }
}

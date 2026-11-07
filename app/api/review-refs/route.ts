import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { normalizeTimezone, rangeBounds, TIME_RANGES, TIMEZONE_COOKIE } from "@/lib/date-range";
import { filterReviewItems, getReviewData, practiceRefs, reviewItemsFor } from "@/lib/review-lists";
import { DASHBOARD_SETS, NOTE_FILTERS, REVIEW_LISTS } from "@/lib/test-results-shared";

export const runtime = "nodejs";

const requestSchema = z.object({
  list: z.enum(REVIEW_LISTS),
  range: z.enum(TIME_RANGES),
  area: z.string().max(300).nullable(),
  test: z.string().max(200).nullable(),
  note: z.enum(NOTE_FILTERS),
  set: z.enum(DASHBOARD_SETS).default("all")
});

// Question refs for every missed or flagged question matching the dashboard
// filters, so the browser can start a custom practice session from them.
export async function POST(request: Request) {
  try {
    const { list, range, area, test, note, set } = requestSchema.parse(await request.json());
    const timeZone = normalizeTimezone((await cookies()).get(TIMEZONE_COOKIE)?.value);
    const bounds = rangeBounds(range, timeZone);
    const result = await getReviewData(bounds.from, bounds.to, set);

    if (!result.ok) {
      return NextResponse.json({ error: "Could not load your questions." }, { status: 503 });
    }
    // All original questions: the session runs under /learn (no access code).
    // Any real exam question: it runs under /tests.
    return NextResponse.json(practiceRefs(filterReviewItems(reviewItemsFor(result.data, list), { area, test, note })));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not load your questions." }, { status: 500 });
  }
}

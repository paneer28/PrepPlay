import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { questionRef } from "@/lib/test-format";
import { getQuestionsByRefs } from "@/lib/tests";

export const runtime = "nodejs";

const MAX_FLAGS_LOADED = 2000;

const refSchema = z.string().regex(/^.+#\d+$/).max(220);
const requestSchema = z.union([
  z.object({ refs: z.array(refSchema).min(1).max(500), flagged: z.boolean() }),
  // Flags kept in the browser from a custom session, by question number there.
  z.object({ session: z.array(refSchema).min(1).max(5000), numbers: z.array(z.number().int().positive()).min(1).max(500) })
]);

// Same lookup (and de-duplication) the session used, so numbers line up.
function refsInSession(session: string[], numbers: number[]) {
  const questions = getQuestionsByRefs(session);
  return numbers.flatMap((number) => {
    const origin = questions[number - 1]?.origin;
    return origin ? [questionRef(origin.testId, origin.number)] : [];
  });
}

const failure = (code: string | undefined) =>
  NextResponse.json({ status: code === "42P01" || code === "PGRST205" ? "unavailable" : "error" }, { status: 503 });

async function signedInClient() {
  const supabase = await createClient();
  if (!supabase) return { response: NextResponse.json({ status: "unavailable" }, { status: 503 }) };
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { response: NextResponse.json({ status: "signed-out" }, { status: 401 }) };
  return { supabase, userId };
}

// The questions this student has flagged, so Infinite can show which already are.
export async function GET() {
  try {
    const { supabase, userId, response } = await signedInClient();
    if (response) return response;

    const { data, error } = await supabase
      .from("flagged_questions")
      .select("ref")
      .eq("user_id", userId)
      .limit(MAX_FLAGS_LOADED);
    if (error) return failure(error.code);

    return NextResponse.json({ refs: data.map((row) => row.ref as string) });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// Flags or unflags questions.
export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const refs = "refs" in body ? body.refs : refsInSession(body.session, body.numbers);
    const flagged = "refs" in body ? body.flagged : true;
    if (refs.length === 0) return NextResponse.json({ status: "saved" });
    const { supabase, userId, response } = await signedInClient();
    if (response) return response;

    const { error } = flagged
      ? await supabase
          .from("flagged_questions")
          .upsert(refs.map((ref) => ({ user_id: userId, ref })), { onConflict: "user_id,ref", ignoreDuplicates: true })
      : await supabase.from("flagged_questions").delete().eq("user_id", userId).in("ref", refs);
    if (error) return failure(error.code);

    return NextResponse.json({ status: "saved" });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ status: "error" }, { status: 400 });
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

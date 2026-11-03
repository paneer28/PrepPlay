import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  items: z.array(z.string().regex(/^(card|checkpoint|mini):/).max(120)).min(1).max(1000)
});

// Saves finished flashcards, checkpoints and mini roleplays to the account.
export async function POST(request: Request) {
  try {
    const { items } = requestSchema.parse(await request.json());
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ status: "unavailable" }, { status: 503 });

    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (!userId) return NextResponse.json({ status: "signed-out" }, { status: 401 });

    const { error } = await supabase
      .from("road_progress")
      .upsert(items.map((item) => ({ user_id: userId, item })), { onConflict: "user_id,item", ignoreDuplicates: true });
    if (error) return NextResponse.json({ status: error.code === "42P01" || error.code === "PGRST205" ? "unavailable" : "error" }, { status: 503 });

    return NextResponse.json({ status: "saved" });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ status: "error" }, { status: 400 });
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

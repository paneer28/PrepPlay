import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteAttempt } from "@/lib/test-results";

export const runtime = "nodejs";

// Deletes one of the signed-in user's saved results (its answers and notes go with it).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }

  const result = await deleteAttempt(id);
  const status = { deleted: 200, "not-found": 404, unavailable: 503, error: 500 }[result];

  return NextResponse.json({ status: result }, { status });
}

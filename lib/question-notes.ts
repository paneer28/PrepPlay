import { createClient } from "@/lib/supabase/server";
import { canonicalRef, getQuestionCopies } from "@/lib/tests";

// One note per question (supabase/migrations/2026-11-06-question-notes.sql),
// stored under the question's first copy. Notes saved under another copy (the
// first copy can change when tests are added) are merged in when read.

type NotesResult = { ok: true; notes: Map<string, string> } | { ok: false; reason: "unavailable" | "error" };

const unavailable = (code: string | undefined) => code === "42P01" || code === "PGRST205";

// Every note the signed-in user has, keyed by canonical ref.
export async function getQuestionNotes(): Promise<NotesResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const rows: Array<{ ref: string; note: string; updated_at: string }> = [];
  const PAGE = 1000;
  for (let from = 0; from < 20 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from("question_notes")
      .select("ref, note, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, reason: unavailable(error.code) ? "unavailable" : "error" };
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const notes = new Map<string, string>();
  for (const row of rows) {
    const ref = canonicalRef(row.ref);
    const existing = notes.get(ref);
    // Newest first, so a merged note keeps the latest text on top.
    notes.set(ref, existing && existing !== row.note ? `${existing}\n\n${row.note}` : row.note);
  }
  return { ok: true, notes };
}

// Saves the note under the question's canonical ref and removes any copies
// saved under its other refs, so the text the user just saved is the only one.
// An empty note deletes it.
export async function saveQuestionNote(ref: string, note: string) {
  const supabase = await createClient();
  if (!supabase) return "unavailable" as const;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return "signed-out" as const;

  const canonical = canonicalRef(ref);
  const aliases = Array.from(new Set([ref, ...(getQuestionCopies().copies.get(canonical) ?? [])])).filter((alias) => alias !== canonical);
  const text = note.trim();

  if (text) {
    const { error } = await supabase
      .from("question_notes")
      .upsert({ user_id: user.id, ref: canonical, note: text, updated_at: new Date().toISOString() }, { onConflict: "user_id,ref" });
    if (error) return unavailable(error.code) ? ("unavailable" as const) : ("error" as const);
  }

  const remove = text ? aliases : [canonical, ...aliases];
  if (remove.length > 0) {
    const { error } = await supabase.from("question_notes").delete().in("ref", remove);
    if (error) return unavailable(error.code) ? ("unavailable" as const) : ("error" as const);
  }
  return "saved" as const;
}

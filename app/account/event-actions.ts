"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decaEventById } from "@/lib/deca-events";
import { EVENT_COOKIE, EVENT_COOKIE_MAX_AGE } from "@/lib/event-cookie";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SaveEventResult = "saved" | "invalid" | "unavailable" | "error";

// Saves the signed-in person's DECA event (null clears it).
export async function saveDecaEvent(eventId: string | null): Promise<SaveEventResult> {
  if (eventId !== null && !decaEventById(eventId)) return "invalid";
  const supabase = await createClient();
  if (!supabase) return "unavailable";

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return "error";

  // Profiles are created at sign-up; the insert only covers accounts made before that.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email ?? "", deca_event: eventId }, { onConflict: "id" });

  // PGRST204: the deca_event column isn't there yet (migration not run).
  if (error) return error.code === "PGRST204" ? "unavailable" : "error";
  revalidatePath("/", "layout");
  return "saved";
}

// The header picker, for everyone: guests keep the event in a cookie, and signed-in
// people also save it to their profile.
export async function setViewerEvent(eventId: string | null): Promise<SaveEventResult> {
  if (eventId !== null && !decaEventById(eventId)) return "invalid";
  const store = await cookies();
  if (eventId) store.set(EVENT_COOKIE, eventId, { sameSite: "lax", path: "/", maxAge: EVENT_COOKIE_MAX_AGE });
  else store.delete(EVENT_COOKIE);

  if (await getViewer()) {
    const saved = await saveDecaEvent(eventId);
    // The cookie still holds the choice while the column isn't set up.
    if (saved !== "unavailable") return saved;
  }
  revalidatePath("/", "layout");
  return "saved";
}

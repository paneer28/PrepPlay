"use server";

import { revalidatePath } from "next/cache";
import { decaEventById } from "@/lib/deca-events";
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

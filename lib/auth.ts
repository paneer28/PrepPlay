import type { Viewer } from "@/types";
import { createClient } from "@/lib/supabase/server";

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email
  };
}

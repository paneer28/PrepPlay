import { cache } from "react";
import type { Viewer } from "@/types";
import { createClient } from "@/lib/supabase/server";

// Who is signed in, once per request. getClaims checks the session token's
// signature locally (the project signs with asymmetric keys), so this doesn't
// call Supabase on every page the way getUser does.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  const email = data?.claims.email;

  if (!id || typeof email !== "string" || !email) {
    return null;
  }

  return { id, email };
});

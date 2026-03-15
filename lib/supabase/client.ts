"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }

  browserClient ??= createBrowserClient(supabaseUrl, supabasePublishableKey);

  return browserClient;
}

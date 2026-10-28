import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

// Refreshes the Supabase session cookies and reports who is signed in
// (`user` is null when signed out or when Supabase isn't configured). getClaims
// refreshes an expired session and checks the token locally, so most requests
// don't wait on Supabase.
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return { response: NextResponse.next({ request }), user: null, configured: false };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims.sub ? { id: data.claims.sub } : null;

  return { response, user, configured: true };
}

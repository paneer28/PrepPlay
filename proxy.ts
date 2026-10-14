import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hasTestsAccess, isGatedPath, needsTestsCode, TESTS_ACCESS_COOKIE } from "@/lib/tests-access";

// Keep any refreshed auth cookies when we answer with a redirect instead.
function withSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user, configured } = await updateSession(request);

  if (!isGatedPath(pathname)) {
    return response;
  }

  // Practice tests need an account first (when sign-in is set up)...
  if (configured && !user) {
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(response, NextResponse.json({ error: "Log in to take practice tests." }, { status: 401 }));
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return withSessionCookies(response, NextResponse.redirect(login));
  }

  // ...and then the access code, for the /exams list too.
  if (needsTestsCode(pathname) && !(await hasTestsAccess(request.cookies.get(TESTS_ACCESS_COOKIE)?.value))) {
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(response, NextResponse.json({ error: "Enter the access code first." }, { status: 401 }));
    }
    const gate = new URL("/tests-access", request.url);
    gate.searchParams.set("next", `${pathname}${search}`);
    return withSessionCookies(response, NextResponse.redirect(gate));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hasTestsAccess, isGatedPath, TESTS_ACCESS_COOKIE } from "@/lib/tests-access";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isGatedPath(pathname) && !(await hasTestsAccess(request.cookies.get(TESTS_ACCESS_COOKIE)?.value))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Enter the practice tests password first." }, { status: 401 });
    }

    const gate = new URL("/tests-access", request.url);
    gate.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(gate);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

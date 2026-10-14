// Access-code gate for the real DECA exams (/exams/* and the questions API).
// PrepPlay's original questions never need it.
//
// The code comes from the TESTS_PASSWORD environment variable. In production
// there is no fallback: without the variable the real exams stay locked. In
// development it falls back to "windsor" so the site works out of the box.
const TESTS_PASSWORD = process.env.TESTS_PASSWORD || (process.env.NODE_ENV === "production" ? null : "windsor");

export const TESTS_ACCESS_COOKIE = "prepplay_tests_access";
export const TESTS_ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// The cookie holds a hash of the password rather than the password itself, so
// changing the password signs everyone out of the tests automatically.
export async function testsAccessToken() {
  if (!TESTS_PASSWORD) return null;
  const bytes = new TextEncoder().encode(`prepplay-tests:${TESTS_PASSWORD}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hasTestsAccess(cookieValue: string | undefined) {
  const token = await testsAccessToken();
  return Boolean(token && cookieValue) && cookieValue === token;
}

// Forgiving about capitals and stray spaces: "Windsor " works too.
export function isTestsPassword(input: string) {
  return Boolean(TESTS_PASSWORD) && input.trim().toLowerCase() === TESTS_PASSWORD!.toLowerCase();
}

// Pages and endpoints for the real exams need an account...
export function isGatedPath(pathname: string) {
  return pathname === "/exams" || pathname.startsWith("/exams/") || pathname.startsWith("/api/practice-questions");
}

// ...and all of them except the /exams list (which shows the exams locked) also
// need the access code before anything is served.
export function needsTestsCode(pathname: string) {
  return isGatedPath(pathname) && pathname !== "/exams";
}

// Only send people back to a tests page, never to another site.
export function safeTestsRedirect(next: string | null | undefined) {
  return next && next.startsWith("/exams") && !next.startsWith("//") ? next : "/exams";
}

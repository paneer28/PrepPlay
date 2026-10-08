// Password gate for the practice tests (/tests and the questions API).
// The password can be overridden with the TESTS_PASSWORD environment variable.
const TESTS_PASSWORD = process.env.TESTS_PASSWORD || "windsor";

export const TESTS_ACCESS_COOKIE = "prepplay_tests_access";
export const TESTS_ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// The cookie holds a hash of the password rather than the password itself, so
// changing the password signs everyone out of the tests automatically.
export async function testsAccessToken() {
  const bytes = new TextEncoder().encode(`prepplay-tests:${TESTS_PASSWORD}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hasTestsAccess(cookieValue: string | undefined) {
  return Boolean(cookieValue) && cookieValue === (await testsAccessToken());
}

// Forgiving about capitals and stray spaces: "Windsor " works too.
export function isTestsPassword(input: string) {
  return input.trim().toLowerCase() === TESTS_PASSWORD.toLowerCase();
}

export function isGatedPath(pathname: string) {
  return pathname === "/tests" || pathname.startsWith("/tests/") || pathname.startsWith("/api/practice-questions");
}

// Only send people back to a tests page, never to another site.
export function safeTestsRedirect(next: string | null | undefined) {
  return next && next.startsWith("/tests") && !next.startsWith("//") ? next : "/tests";
}

// Chapter access: the code that unlocks real DECA content. PrepPlay's original
// questions, the roads, and the Tests list of originals never need it.
//
// The code is "windsor" unless the TESTS_PASSWORD environment variable sets a
// different one (in every environment, including production).
const TESTS_PASSWORD = process.env.TESTS_PASSWORD?.trim() || "windsor";

// Off for now: everyone counts as unlocked, and the code screen, the "Chapter
// access on" badge and the account setting are all hidden. Set to true to bring them back.
export const TESTS_CODE_REQUIRED = false;

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
  if (!TESTS_CODE_REQUIRED) return true;
  const token = await testsAccessToken();
  return Boolean(token && cookieValue) && cookieValue === token;
}

// Forgiving about capitals and stray spaces: "Windsor " works too.
export function isTestsPassword(input: string) {
  return Boolean(TESTS_PASSWORD) && input.trim().toLowerCase() === TESTS_PASSWORD!.toLowerCase();
}

// /exams itself, the Tests list, is open to everyone: it leaves real exams out
// until the code has been entered.
// Pages and endpoints for the real exams need an account...
export function isGatedPath(pathname: string) {
  return pathname.startsWith("/exams/") || pathname.startsWith("/api/practice-questions");
}

// ...and all of them need the access code before anything is shown: without
// it, visitors see only the code screen.
export function needsTestsCode(pathname: string) {
  return isGatedPath(pathname);
}

// Only send people back to a tests page or their account, never to another site.
export function safeTestsRedirect(next: string | null | undefined) {
  return next && (next.startsWith("/exams") || next === "/account") && !next.startsWith("//") ? next : "/exams";
}

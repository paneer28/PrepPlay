// Only allow redirects to paths on this site (blocks "//evil.com", "/\\evil.com"
// and absolute URLs), falling back to `fallback`.
export function safeNext(next: string | null | undefined, fallback = "/learn") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

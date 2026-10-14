import { SET_ROUTES } from "@/lib/question-sets";
import type { TestAttempt } from "@/lib/test-progress";

// Browser-only: the most recent unfinished practice set, custom practice
// session or exam, for the Continue button. Attempts are kept in localStorage
// by the test runner (see lib/test-progress.ts).

export type Resumable = {
  label: string;
  href: string;
  answered: number;
  total: number;
  updatedAt: string;
};

// Saves made before labels existed: work the name and link out from the key.
function fallback(key: string, testId: string): { label: string; href: string } {
  if (key === SET_ROUTES.original.attemptKey) return { label: "Custom practice", href: SET_ROUTES.original.session };
  if (key === SET_ROUTES.deca.attemptKey) return { label: "Custom exam practice", href: SET_ROUTES.deca.session };
  return testId.startsWith("prepplay-original-")
    ? { label: "Practice set", href: `/learn/set/${testId}` }
    : { label: "Practice exam", href: `/exams/${testId}` };
}

export function findResumable(): Resumable | null {
  let latest: Resumable | null = null;

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !(key.startsWith("prepplay:test:") || key === SET_ROUTES.original.attemptKey || key === SET_ROUTES.deca.attemptKey)) continue;

      const attempt = JSON.parse(window.localStorage.getItem(key) ?? "null") as TestAttempt | null;
      if (!attempt || attempt.version !== 1 || attempt.status !== "in-progress") continue;

      const named = attempt.label && attempt.href ? { label: attempt.label, href: attempt.href } : fallback(key, attempt.testId);
      const candidate = {
        ...named,
        answered: Object.keys(attempt.answers).length,
        total: attempt.questionCount,
        updatedAt: attempt.updatedAt ?? attempt.startedAt
      };
      if (!latest || candidate.updatedAt > latest.updatedAt) latest = candidate;
    }
  } catch {
    // Storage unavailable: nothing to resume.
  }

  return latest;
}

// Fired when this tab saves an attempt, so the header updates without a
// navigation ("storage" events only reach other tabs).
export const RESUME_EVENT = "prepplay-resume-change";

export function notifyResumeChange() {
  try {
    window.dispatchEvent(new Event(RESUME_EVENT));
  } catch {
    // Not in a browser.
  }
}

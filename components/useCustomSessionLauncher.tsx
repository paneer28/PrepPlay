"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TestDialog } from "@/components/TestDialog";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import { customSessionInProgress, saveCustomSession, type CustomSession } from "@/lib/test-progress";

// Starts a custom practice session, asking first if it would replace a session
// that's still in progress. Render `dialog` somewhere in the calling component.
// Real exams and original questions each keep their own session (`set`).
export function useCustomSessionLauncher(defaultSet: QuestionSet = "deca") {
  const router = useRouter();
  const [pending, setPending] = useState<{ session: CustomSession; set: QuestionSet; answered: number; total: number } | null>(null);

  const go = (session: CustomSession, set: QuestionSet) => {
    saveCustomSession(session, set);
    setPending(null);
    router.push(SET_ROUTES[set].session);
  };

  const launch = (session: CustomSession, set: QuestionSet = defaultSet) => {
    const current = customSessionInProgress(set);
    if (current) {
      setPending({ session, set, ...current });
    } else {
      go(session, set);
    }
  };

  const dialog = pending ? (
    <TestDialog
      warning
      eyebrow="Session in progress"
      title="Replace your current custom session?"
      cancelLabel="Cancel"
      confirmLabel="Replace it"
      onCancel={() => setPending(null)}
      onConfirm={() => go(pending.session, pending.set)}
    >
      <p className="mt-3 text-fg">
        You&apos;ve answered {pending.answered} of {pending.total} questions in your current session. Starting a new
        one will discard that progress.
      </p>
    </TestDialog>
  ) : null;

  return { launch, dialog };
}

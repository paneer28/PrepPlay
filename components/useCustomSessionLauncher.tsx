"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TestDialog } from "@/components/TestDialog";
import { customSessionInProgress, saveCustomSession, type CustomSession } from "@/lib/test-progress";

// Starts a custom practice session, asking first if it would replace a session
// that's still in progress. Render `dialog` somewhere in the calling component.
export function useCustomSessionLauncher() {
  const router = useRouter();
  const [pending, setPending] = useState<{ session: CustomSession; answered: number; total: number } | null>(null);

  const go = (session: CustomSession) => {
    saveCustomSession(session);
    setPending(null);
    router.push("/tests/custom/session");
  };

  const launch = (session: CustomSession) => {
    const current = customSessionInProgress();
    if (current) {
      setPending({ session, ...current });
    } else {
      go(session);
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
      onConfirm={() => go(pending.session)}
    >
      <p className="mt-3 text-sm leading-7 text-muted">
        You&apos;ve answered {pending.answered} of {pending.total} questions in your current session. Starting a new
        one will discard that progress.
      </p>
    </TestDialog>
  ) : null;

  return { launch, dialog };
}

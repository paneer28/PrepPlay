"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TestDialog } from "@/components/TestDialog";
import { deleteSavedAttempt, forgetLocalAttempt } from "@/lib/test-sync";

// Deletes a saved test or custom session after a confirmation. On the History
// list the dashboard refreshes in place; on the detail page it returns to the
// dashboard (`redirectTo`).
export function DeleteAttemptButton({
  attemptId,
  label,
  redirectTo,
  variant = "link"
}: {
  attemptId: string;
  label: string;
  redirectTo?: string;
  variant?: "link" | "button";
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "deleting" | "error">("idle");

  const remove = async () => {
    setConfirming(false);
    setState("deleting");
    if (!(await deleteSavedAttempt(attemptId))) {
      setState("error");
      return;
    }
    forgetLocalAttempt(attemptId);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={state === "deleting"}
        aria-label={`Delete ${label}`}
        className={
          variant === "button"
            ? "rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            : "text-sm font-semibold text-muted transition hover:text-red-700 disabled:opacity-50"
        }
      >
        {state === "deleting" ? "Deleting…" : "Delete"}
      </button>
      {state === "error" ? <span className="text-xs text-red-700">Couldn&apos;t delete. Try again.</span> : null}
      {confirming ? (
        <TestDialog
          warning
          danger
          eyebrow="Delete result"
          title="Delete this result?"
          cancelLabel="Keep it"
          confirmLabel="Delete"
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
        >
          <p className="mt-3 text-sm leading-7 text-muted">
            {label} will be removed from your dashboard, along with its answers and notes. Your stats will update. This
            can&apos;t be undone.
          </p>
        </TestDialog>
      ) : null}
    </>
  );
}

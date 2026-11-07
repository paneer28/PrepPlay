"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveFlag } from "@/lib/test-sync";

// Takes a question off the flagged list and refreshes the dashboard in place.
// `refs`: every ref the question is flagged under.
export function UnflagButton({ refs }: { refs: string[] }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const remove = async () => {
    setState("saving");
    if (await saveFlag(refs, false)) router.refresh();
    else setState("error");
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={state === "saving"}
        className="rounded text-small font-bold text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
      >
        {state === "saving" ? "Removing…" : "Remove flag"}
      </button>
      {state === "error" ? <span className="text-label font-bold text-wrong-text">Couldn&apos;t remove it. Try again.</span> : null}
    </span>
  );
}

"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react";
import { useActionState, useTransition } from "react";
import { removeChapterCodeAction, unlockTestsAction, type UnlockState } from "@/app/tests-access/actions";
import { Button } from "@/components/ds/Button";
import { TextInput } from "@/components/ds/Field";

const initialState: UnlockState = { error: null };

// The chapter code, in account settings: one code unlocks real DECA content.
export function ChapterAccessSetting({ unlocked }: { unlocked: boolean }) {
  const [state, formAction, pending] = useActionState(unlockTestsAction, initialState);
  const [removing, startRemoving] = useTransition();

  if (unlocked) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-small font-bold text-correct-text">
          <ShieldCheckIcon size={18} weight="fill" aria-hidden="true" />
          Chapter access on
        </span>
        <button
          type="button"
          disabled={removing}
          onClick={() => startRemoving(() => removeChapterCodeAction())}
          className="min-h-11 rounded-control text-small font-bold text-brand-text hover:underline disabled:opacity-60"
        >
          Remove code
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <input type="hidden" name="next" value="/account" />
      <label htmlFor="chapter-code" className="shrink-0 text-small font-bold text-fg">
        Chapter code
      </label>
      <div className="flex gap-2">
        <TextInput
          id="chapter-code"
          type="password"
          name="password"
          required
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "chapter-code-error" : undefined}
          className="sm:w-56"
        />
        <Button type="submit" variant="secondary" disabled={pending} className="h-12 shrink-0">
          {pending ? "Checking…" : "Turn on"}
        </Button>
      </div>
      {state.error ? (
        <p id="chapter-code-error" role="alert" className="text-small font-bold text-wrong-text">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

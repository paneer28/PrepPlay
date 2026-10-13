"use client";

import { LockSimpleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { Button } from "@/components/ds/Button";
import { FieldLabel, TextInput } from "@/components/ds/Field";
import { unlockTestsAction, type UnlockState } from "@/app/tests-access/actions";

const initialState: UnlockState = { error: null };

export function TestsAccessForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(unlockTestsAction, initialState);

  return (
    <section aria-labelledby="tests-access-title" className="card mx-auto max-w-md space-y-6 sm:p-8">
      <div className="space-y-2">
        <span className="grid h-12 w-12 place-items-center rounded-control bg-brand-tint text-brand-text">
          <LockSimpleIcon size={24} weight="bold" aria-hidden="true" />
        </span>
        <p className="pt-2 text-label font-bold text-fg-muted">Practice tests</p>
        <h1 id="tests-access-title" className="font-display text-h2 font-extrabold text-fg">
          Enter the password
        </h1>
        <p className="text-fg">The practice tests are password protected.</p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <FieldLabel label="Password">
          <TextInput
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "tests-password-error" : undefined}
            className={state.error ? "border-wrong" : ""}
          />
        </FieldLabel>

        {state.error ? (
          <p id="tests-password-error" role="alert" className="rounded-control bg-wrong-tint px-4 py-3 text-small font-bold text-wrong-text">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? "Checking…" : "Unlock practice tests"}
        </Button>
      </form>
    </section>
  );
}

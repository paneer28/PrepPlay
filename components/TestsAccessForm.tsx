"use client";

import { useActionState } from "react";
import { unlockTestsAction, type UnlockState } from "@/app/tests-access/actions";

const initialState: UnlockState = { error: null };

export function TestsAccessForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(unlockTestsAction, initialState);

  return (
    <section className="surface mx-auto max-w-md overflow-hidden">
      <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
        <p className="eyebrow">Practice tests</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">Enter the password</h1>
        <p className="mt-2 text-base leading-7 text-muted">The practice tests are password protected.</p>
      </div>

      <form action={formAction} className="space-y-5 p-7 sm:p-9">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "tests-password-error" : undefined}
            className={`rounded-[1.1rem] border bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent ${
              state.error ? "border-red-200" : "border-line"
            }`}
          />
        </label>

        {state.error ? (
          <p id="tests-password-error" role="alert" className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? "Checking…" : "Unlock practice tests"}
        </button>
      </form>
    </section>
  );
}

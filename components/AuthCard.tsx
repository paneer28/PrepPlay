"use client";

import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Checkbox, FieldLabel, TextInput } from "@/components/ds/Field";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "signup";

function getRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/auth/callback?next=/practice`;
}

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfigured = useMemo(() => isSupabaseConfigured(), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
            data: {
              marketing_opt_in: marketingOptIn
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.push("/practice");
          router.refresh();
          return;
        }

        setStatusMessage("Account created. Check your email to confirm your signup, then come back to practice.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      router.push("/practice");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="auth-title" className="mx-auto max-w-5xl overflow-hidden rounded-card border-[1.5px] border-rule bg-page">
      <div className="space-y-3 p-6 sm:p-9">
        <p className="text-label font-bold text-fg-muted">Account access</p>
        <h1 id="auth-title" className="max-w-3xl font-display text-h2 font-extrabold text-fg sm:text-h1">
          Save your progress and avoid repeated roleplays
        </h1>
        <p className="max-w-3xl text-fg">
          Create an account to save practice history, keep your email on file, and let PrepPlay avoid giving you the same scenario
          over and over.
        </p>
      </div>

      <div className="grid gap-10 border-t-[1.5px] border-rule p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <SegmentedControl<AuthMode>
            label="Sign up or log in"
            value={mode}
            onChange={setMode}
            items={[
              { value: "signup", label: "Sign up" },
              { value: "login", label: "Log in" }
            ]}
          />

          {isConfigured ? (
            <form onSubmit={handleSubmit} className="max-w-md space-y-5">
              <FieldLabel label="Email">
                <TextInput type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </FieldLabel>

              <FieldLabel label="Password">
                <TextInput
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                />
              </FieldLabel>

              {mode === "signup" ? (
                <Checkbox
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  label="I want updates and practice tips by email."
                />
              ) : null}

              {errorMessage ? (
                <p role="alert" className="rounded-control bg-wrong-tint px-4 py-3 text-small font-bold text-wrong-text">
                  {errorMessage}
                </p>
              ) : null}

              {statusMessage ? (
                <p role="status" className="rounded-control bg-correct-tint px-4 py-3 text-small font-bold text-correct-text">
                  {statusMessage}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
              </Button>
            </form>
          ) : (
            <p className="flex items-start gap-2.5 rounded-control bg-surface px-4 py-3 text-small text-fg">
              <WarningCircleIcon size={20} weight="bold" aria-hidden="true" className="shrink-0 text-wrong-text" />
              <span>
                Supabase is not configured yet. Add the project URL and publishable key to <code>.env.local</code> to turn on sign up
                and log in.
              </span>
            </p>
          )}
        </div>

        <aside className="space-y-6 lg:border-l-[1.5px] lg:border-rule lg:pl-8">
          <div>
            <h2 className="text-small font-extrabold text-fg">Why sign in</h2>
            <ul className="mt-2 space-y-2 text-small text-fg">
              {["Save your email and account", "Keep a history of generated roleplays", "Reduce repeated scenarios for your account"].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon size={16} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-correct" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t-[1.5px] border-rule pt-6">
            <h2 className="text-small font-extrabold text-fg">Guest mode</h2>
            <p className="mt-1 text-small text-fg">You can still practice without signing in.</p>
            {!showGuestWarning ? (
              <Button variant="secondary" className="mt-4" onClick={() => setShowGuestWarning(true)}>
                Continue as guest
              </Button>
            ) : (
              <div className="mt-4 space-y-3 rounded-control bg-surface p-4">
                <p className="text-small text-fg">
                  If you continue as a guest, your progress will not be saved and you may get repeated roleplays.
                </p>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href="/practice" size="sm">
                    Continue anyway
                  </ButtonLink>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuestWarning(false)}>
                    Go back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

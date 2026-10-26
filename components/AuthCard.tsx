"use client";

import { CheckIcon, FlameIcon, GoogleLogoIcon, LockSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Checkbox, FieldLabel, TextInput } from "@/components/ds/Field";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "signup";

function getRedirectUrl(next: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

// `next`: where to go after signing in. `reason`: why the visitor was sent here.
export function AuthCard({
  next = "/learn",
  reason = null,
  initialMode = "signup"
}: {
  next?: string;
  reason?: "tests" | null;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
            emailRedirectTo: getRedirectUrl(next),
            data: {
              marketing_opt_in: marketingOptIn
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.push(next);
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

      router.push(next);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Leaves the page for Google's sign-in, which returns through /auth/callback.
  async function handleGoogle() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getRedirectUrl(next) }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  }

  const benefits = ["Save your email and account", "Keep a history of generated roleplays", "Reduce repeated scenarios for your account"];

  return (
    // Fills the screen under the header so the footer stays below the fold.
    <div className="flex min-h-[calc(100svh-4rem-4rem)] items-center">
    <div className="grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      {/* Brand panel */}
      <section
        aria-labelledby="auth-title"
        className="relative order-2 flex flex-col gap-8 overflow-hidden rounded-[24px] bg-brand p-8 text-white shadow-[0_6px_0_var(--brand-edge)] sm:p-10 lg:order-1"
      >
        <div className="space-y-7">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-label font-extrabold">Account access</span>
          <h1 id="auth-title" className="max-w-[16ch] font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            Save your progress and avoid repeated roleplays
          </h1>
          <p className="max-w-md font-semibold text-white/90">
            Create an account to save practice history, keep your email on file, and let PrepPlay avoid giving you the same scenario
            over and over.
          </p>
        </div>

          <div>
            <h2 className="text-small font-extrabold text-white/80">Why sign in</h2>
            <ul className="mt-3 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
                    <CheckIcon size={16} weight="bold" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Decorative: what an account unlocks */}
        <div aria-hidden="true" className="hidden gap-3 sm:flex">
            <span className="inline-flex -rotate-2 items-center gap-2 rounded-[14px] border-[1.5px] border-streak bg-page px-3 py-2 font-display text-small font-extrabold text-fg shadow-[0_4px_0_var(--streak-edge)]">
              <FlameIcon size={18} weight="fill" className="text-streak" />
              12-day streak
            </span>
            <span className="inline-flex w-48 rotate-2 flex-col rounded-[14px] bg-page px-3 py-2 shadow-[0_4px_0_var(--brand-edge)]">
              <span className="text-label font-extrabold text-fg">Saved roleplays</span>
              <span className="mt-1 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <span className="block h-full w-[72%] rounded-full bg-correct" />
                </span>
                <span className="text-label font-extrabold tabular-nums text-fg">18</span>
              </span>
            </span>
        </div>
      </section>

      {/* Form */}
      <section
        aria-label={mode === "signup" ? "Create your account" : "Log in"}
        className="order-1 flex flex-col justify-center rounded-[24px] border-[1.5px] border-rule bg-page p-6 shadow-[0_6px_0_var(--rule)] sm:p-8 lg:order-2"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <SegmentedControl<AuthMode>
              label="Sign up or log in"
              block
              value={mode}
              onChange={setMode}
              items={[
                { value: "signup", label: "Sign up" },
                { value: "login", label: "Log in" }
              ]}
            />
            <h2 className="font-display text-h2 font-extrabold text-fg">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
            {reason === "tests" ? (
              <p className="flex items-start gap-2.5 rounded-control bg-brand-tint px-4 py-3 text-small font-semibold text-fg">
                <LockSimpleIcon size={18} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-brand-text" />
                <span>Practice tests need a free account. Log in or sign up and we&apos;ll take you right back to your test.</span>
              </p>
            ) : null}
          </div>

          {isConfigured ? (
            <div className="space-y-5">
            <Button
              variant="secondary"
              size="lg"
              block
              disabled={isSubmitting}
              onClick={handleGoogle}
              icon={<GoogleLogoIcon size={20} weight="bold" aria-hidden="true" />}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-label font-bold text-fg-muted" aria-hidden="true">
              <span className="h-[1.5px] flex-1 bg-rule" />
              or use email
              <span className="h-[1.5px] flex-1 bg-rule" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button type="submit" size="lg" block disabled={isSubmitting}>
                {isSubmitting ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
              </Button>
            </form>
            </div>
          ) : (
            <p className="flex items-start gap-2.5 rounded-control bg-surface px-4 py-3 text-small text-fg">
              <WarningCircleIcon size={20} weight="bold" aria-hidden="true" className="shrink-0 text-wrong-text" />
              <span>
                Supabase is not configured yet. Add the project URL and publishable key to <code>.env.local</code> to turn on sign up
                and log in.
              </span>
            </p>
          )}

          <div className="flex items-center gap-3 text-label font-bold text-fg-muted" aria-hidden="true">
            <span className="h-[1.5px] flex-1 bg-rule" />
            or
            <span className="h-[1.5px] flex-1 bg-rule" />
          </div>

          <div className="space-y-3 text-center">
            <p className="text-small text-fg-muted">
              <span className="font-extrabold text-fg">Guest mode.</span>{" "}
              {reason === "tests" ? "You can still practice roleplays without signing in." : "You can still practice without signing in."}
            </p>
            {!showGuestWarning ? (
              <Button variant="secondary" block onClick={() => setShowGuestWarning(true)}>
                Continue as guest
              </Button>
            ) : (
              <div className="space-y-3 rounded-control bg-surface p-4 text-left">
                <p className="text-small text-fg">
                  If you continue as a guest, your progress will not be saved and you may get repeated roleplays.
                </p>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href="/roleplays" size="sm">
                    Continue anyway
                  </ButtonLink>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuestWarning(false)}>
                    Go back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}

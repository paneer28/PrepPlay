"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
    <section className="surface overflow-hidden">
      <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
        <p className="eyebrow">Account Access</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">
          Save your progress and avoid repeated roleplays
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          Create an account to save practice history, keep your email on file, and let PrepPlay avoid giving
          you the same scenario over and over.
        </p>
      </div>

      <div className="grid gap-8 p-7 lg:grid-cols-[minmax(0,1fr)_320px] sm:p-9">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-line bg-[#f8fbff] p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
              }`}
            >
              Log in
            </button>
          </div>

          {isConfigured ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
                  placeholder="you@example.com"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
                  placeholder="At least 6 characters"
                />
              </label>

              {mode === "signup" ? (
                <label className="flex gap-3 rounded-[1.2rem] border border-line bg-[#f8fbff] px-4 py-4 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(event) => setMarketingOptIn(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-line"
                  />
                  <span>I want updates and practice tips by email.</span>
                </label>
              ) : null}

              {errorMessage ? (
                <p className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              {statusMessage ? (
                <p className="rounded-[1.2rem] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {statusMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>
          ) : (
            <p className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Supabase is not configured yet. Add the project URL and publishable key to <code>.env.local</code> to
              turn on sign up and log in.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="surface-soft p-5">
            <p className="eyebrow">Why sign in</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
              <li>Save your email and account</li>
              <li>Keep a history of generated roleplays</li>
              <li>Reduce repeated scenarios for your account</li>
            </ul>
          </div>

          <div className="surface-soft p-5">
            <p className="eyebrow">Guest mode</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              You can still practice without signing in.
            </p>
            {!showGuestWarning ? (
              <button
                type="button"
                onClick={() => setShowGuestWarning(true)}
                className="mt-4 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
              >
                Continue as guest
              </button>
            ) : (
              <div className="mt-4 space-y-4 rounded-[1.3rem] border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-7 text-amber-900">
                  If you continue as a guest, your progress will not be saved and you may get repeated roleplays.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/practice"
                    className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
                  >
                    Continue anyway
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowGuestWarning(false)}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

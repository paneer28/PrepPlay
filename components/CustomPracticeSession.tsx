"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PracticeTestRunner, type RunnerContext } from "@/components/PracticeTestRunner";
import { CUSTOM_ATTEMPT_KEY, loadCustomSession, type CustomSession } from "@/lib/test-progress";
import type { PracticeTest, TestQuestion } from "@/types";

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; test: PracticeTest; context: RunnerContext };

function buildTest(session: CustomSession, questions: TestQuestion[]): PracticeTest {
  return {
    id: session.id,
    title: "Custom practice set",
    cluster: "Custom practice",
    year: null,
    event: null,
    // Custom sessions are always untimed.
    timeLimitMinutes: 0,
    // Renumber 1..N within the session; the original number lives on `origin`.
    questions: questions.map((question, index) => ({ ...question, number: index + 1 }))
  };
}

// Rendered client-only (see CustomPracticeSessionLoader): reads the session
// definition from localStorage, then fetches the full questions for it.
export function CustomPracticeSession() {
  const [session] = useState(loadCustomSession);
  const [state, setState] = useState<LoadState>(() => (session ? { status: "loading" } : { status: "missing" }));

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    fetch("/api/practice-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: session.refs })
    })
      .then(async (response) => {
        const data = (await response.json()) as { questions?: TestQuestion[]; error?: string };
        if (!response.ok || !data.questions) {
          throw new Error(data.error ?? "Could not load questions.");
        }
        return data.questions;
      })
      .then((questions) => {
        if (cancelled) return;
        if (questions.length === 0) {
          setState({ status: "error", message: "The questions in this session are no longer available." });
          return;
        }
        setState({
          status: "ready",
          test: buildTest(session, questions),
          context: {
            storageKey: CUSTOM_ATTEMPT_KEY,
            subtitle: `${questions.length} questions · ${session.summary}`,
            backHref: "/tests/custom",
            backLabel: "Custom practice",
            upload: { mode: "custom", refs: session.refs, summary: session.summary, selections: session.filters }
          }
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", message: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (state.status === "loading") {
    return <LoadingState label="Loading your questions" />;
  }

  if (state.status === "ready") {
    return <PracticeTestRunner test={state.test} context={state.context} />;
  }

  return (
    <div className="surface px-6 py-14 text-center">
      <h1 className="text-xl font-bold tracking-[-0.03em] text-ink">
        {state.status === "missing" ? "No custom session yet" : "Couldn't load this session"}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {state.status === "missing"
          ? "Build a question set from the custom practice filters to get started."
          : state.message}
      </p>
      <Link
        href="/tests/custom"
        className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
      >
        Go to custom practice
      </Link>
    </div>
  );
}

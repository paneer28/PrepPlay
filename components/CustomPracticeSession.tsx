"use client";

import { ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { PracticeTestRunner, type RunnerContext } from "@/components/PracticeTestRunner";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import { loadCustomSession, type CustomSession } from "@/lib/test-progress";
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
// definition from localStorage, then fetches the full questions for it. Real
// exams and original questions use separate sessions and endpoints (`set`).
export function CustomPracticeSession({ set = "deca" }: { set?: QuestionSet }) {
  const routes = SET_ROUTES[set];
  const [session] = useState(() => loadCustomSession(set));
  const [state, setState] = useState<LoadState>(() => (session ? { status: "loading" } : { status: "missing" }));

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    fetch(routes.questionsApi, {
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
            storageKey: routes.attemptKey,
            subtitle: `${questions.length} questions · ${session.summary}`,
            backHref: routes.custom,
            backLabel: "Custom practice",
            upload: { mode: "custom", refs: session.refs, summary: session.summary, selections: session.filters },
            set,
            resume: { label: set === "original" ? "Custom practice" : "Custom exam practice", href: routes.session }
          }
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", message: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [session, routes, set]);

  if (state.status === "loading") {
    return <LoadingState label="Loading your questions" />;
  }

  if (state.status === "ready") {
    return <PracticeTestRunner test={state.test} context={state.context} />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <Illustration kind="empty" size={140} />
      <h1 className="mt-6 font-display text-h3 font-extrabold text-fg">
        {state.status === "missing" ? "No custom session yet" : "Couldn't load this session"}
      </h1>
      <p className="mt-2 text-fg">
        {state.status === "missing"
          ? "Build a question set from the custom practice filters to get started."
          : state.message}
      </p>
      <ButtonLink href={routes.custom} size="lg" className="mt-6">
        Go to custom practice
      </ButtonLink>
    </div>
  );
}

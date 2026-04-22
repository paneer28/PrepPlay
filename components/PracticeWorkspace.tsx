"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { JudgeEvaluationCard } from "@/components/JudgeEvaluationCard";
import { LoadingState } from "@/components/LoadingState";
import { ParticipantPacket } from "@/components/ParticipantPacket";
import { ResponseBox } from "@/components/ResponseBox";
import { RoleplayForm } from "@/components/RoleplayForm";
import { LIMITS } from "@/lib/config";
import type { JudgeEvaluation, ParticipantRoleplay, PracticeOptions, RoleplayRequest, Viewer } from "@/types";

type PracticeWorkspaceProps = {
  options: PracticeOptions;
  viewer: Viewer | null;
};

function createInitialRequest(options: PracticeOptions): RoleplayRequest {
  const firstCluster = options.clusters[0];
  const firstEvent = options.events.find((event) => event.clusterId === firstCluster.id) ?? options.events[0];

  return {
    eventId: firstEvent.id,
    clusterId: firstCluster.id,
    difficulty: "medium",
    industry: "",
    instructionalAreaPreference: "",
    specificPerformanceIndicatorIds: [],
    numberOfPis: 5
  };
}

export function PracticeWorkspace({ options, viewer }: PracticeWorkspaceProps) {
  const [request, setRequest] = useState<RoleplayRequest>(() => createInitialRequest(options));
  const [roleplay, setRoleplay] = useState<ParticipantRoleplay | null>(null);
  const [responseText, setResponseText] = useState("");
  const [evaluation, setEvaluation] = useState<JudgeEvaluation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => options.events.find((event) => event.id === request.eventId),
    [options.events, request.eventId]
  );

  const handleGenerate = async () => {
    setErrorMessage(null);
    setEvaluation(null);
    setResponseText("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not generate a roleplay.");
      setRoleplay(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not generate a roleplay.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJudge = async () => {
    if (!roleplay) return;

    setErrorMessage(null);
    setIsJudging(true);

    try {
      const response = await fetch("/api/judge-roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, participantRoleplay: roleplay, userResponse: responseText })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not judge this roleplay.");
      setEvaluation(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not judge this roleplay.");
    } finally {
      setIsJudging(false);
    }
  };

  const handlePracticeAgain = () => {
    setRoleplay(null);
    setResponseText("");
    setEvaluation(null);
    setErrorMessage(null);
  };

  const phase = evaluation ? 3 : roleplay ? 2 : 1;

  return (
    <div className="space-y-8 pt-2">

      {/* ── Workspace hero ──────────────────────────────── */}
      <section className="surface-dark relative overflow-hidden px-8 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-blue-600 opacity-10 blur-3xl" />
          <div className="absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-violet-600 opacity-10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              Practice workspace
            </div>
            <h1 className="mt-4 max-w-[14ch] text-3xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
              Build the round before you unlock the scoring.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              Generate a participant packet, answer in your own words, then unlock judge-side scoring
              only after you commit to your response.
            </p>
            {selectedEvent ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
                  {selectedEvent.name}
                </span>
                <span className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/70">
                  {request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)}
                </span>
                <span className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/70">
                  {request.numberOfPis} PIs
                </span>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 space-y-3 lg:w-64">
            {[
              { label: "Phase 1", title: "Participant packet", active: phase >= 1 },
              { label: "Phase 2", title: "Your response", active: phase >= 2 },
              { label: "Phase 3", title: "Judge evaluation", active: phase >= 3 },
            ].map((p, i) => (
              <div
                key={p.label}
                className={`flex items-center gap-3 rounded-[1.2rem] px-4 py-3 transition ${
                  p.active
                    ? "bg-white/15 text-white"
                    : "border border-white/8 bg-white/5 text-white/40"
                }`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  p.active ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white" : "bg-white/10 text-white/40"
                }`}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] opacity-60">{p.label}</p>
                  <p className="text-sm font-semibold">{p.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Progress bar ───────────────────────────────── */}
      <section className="surface overflow-hidden p-0">
        <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            { label: "Packet status", value: roleplay ? "Generated" : "Waiting", muted: !roleplay },
            { label: "Your response", value: `${responseText.trim().length} chars`, muted: responseText.trim().length === 0 },
            { label: "Judge feedback", value: evaluation ? "Unlocked" : "Hidden", muted: !evaluation },
          ].map((item) => (
            <div key={item.label} className="p-6">
              <p className="eyebrow">{item.label}</p>
              <p className={`mt-3 text-2xl font-bold tracking-[-0.03em] ${item.muted ? "text-muted" : "text-ink"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Auth banner ─────────────────────────────────── */}
      {viewer ? (
        <div className="flex items-center gap-3 rounded-[1.4rem] border border-green-200 bg-green-50 px-5 py-3.5 text-sm text-green-800">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-green-600">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          Signed in as <span className="font-semibold">{viewer.email}</span>. PrepPlay works harder to avoid repeated situations for your account.
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-900">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>
            Practicing as a guest — progress not saved, repeats possible.{" "}
            <Link href="/login" className="font-semibold text-amber-950 underline underline-offset-4">
              Log in or sign up
            </Link>{" "}
            to reduce repeats.
          </span>
        </div>
      )}

      <RoleplayForm
        value={request}
        options={options}
        onChange={setRequest}
        onSubmit={handleGenerate}
        isLoading={isGenerating}
      />

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </div>
      ) : null}

      {isGenerating ? <LoadingState label="Generating a fresh participant packet..." /> : null}

      {!roleplay && !isGenerating ? (
        <EmptyState
          title="No packet yet"
          description="Choose your setup above, then click Generate Roleplay to create a participant-facing DECA packet."
        />
      ) : null}

      {roleplay ? (
        <>
          <ParticipantPacket key={roleplay.id} roleplay={roleplay} />
          <ResponseBox
            value={responseText}
            onChange={setResponseText}
            onSubmit={handleJudge}
            onPracticeAgain={handlePracticeAgain}
            isJudging={isJudging}
            disabled={responseText.trim().length < LIMITS.minResponseCharacters}
          />
        </>
      ) : null}

      {isJudging ? <LoadingState label="Evaluating your response like a DECA judge..." /> : null}

      {evaluation ? <JudgeEvaluationCard evaluation={evaluation} /> : null}
    </div>
  );
}

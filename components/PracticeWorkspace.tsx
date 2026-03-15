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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate a roleplay.");
      }

      setRoleplay(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not generate a roleplay.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJudge = async () => {
    if (!roleplay) {
      return;
    }

    setErrorMessage(null);
    setIsJudging(true);

    try {
      const response = await fetch("/api/judge-roleplay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          request,
          participantRoleplay: roleplay,
          userResponse: responseText
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not judge this roleplay.");
      }

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

  return (
    <div className="space-y-10 pt-2">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
        <div className="surface p-8 sm:p-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-accentSoft px-4 py-2 text-sm font-semibold text-accent">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-xs font-bold text-white shadow-card">
              LIVE
            </span>
            Practice workspace
          </div>
          <h1 className="mt-6 max-w-[12ch] text-4xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-6xl">
            Build the round before you unlock the scoring.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
            Generate a participant packet, answer in your own words, then unlock judge-side scoring
            only after you commit to your response.
          </p>
          {selectedEvent ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2 text-sm font-semibold text-white shadow-card">
                {selectedEvent.name}
              </span>
              <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-muted">
                {request.difficulty.toUpperCase()}
              </span>
              <span className="rounded-full border border-line bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-muted">
                {request.numberOfPis} PIs
              </span>
            </div>
          ) : null}
        </div>

        <aside className="surface p-6">
          <div className="space-y-4">
            <div className="surface-soft p-5">
              <p className="eyebrow">Phase 1</p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">Participant packet only</p>
              <p className="mt-2 text-base leading-7 text-muted">
                Read the scenario, instructions, skills, and randomized PI set before any evaluation appears.
              </p>
            </div>
            <div className="surface-soft p-5">
              <p className="eyebrow">Phase 2</p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">Judge side unlocks after submission</p>
              <p className="mt-2 text-base leading-7 text-muted">
                Follow-up questions, score estimates, and coaching notes stay hidden until you answer.
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#eff5ff,#f7faff)] p-5">
              <p className="eyebrow">Current setup</p>
              <div className="mt-4 grid gap-3 text-sm text-muted">
                <div className="flex items-center justify-between">
                  <span>Cluster</span>
                  <span className="font-semibold text-ink">
                    {options.clusters.find((cluster) => cluster.id === request.clusterId)?.label ?? "Selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>PI area</span>
                  <span className="font-semibold text-ink">
                    {request.instructionalAreaPreference.trim() || "Automatic"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Industry</span>
                  <span className="font-semibold text-ink">{request.industry.trim() || "General business"}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="surface overflow-hidden p-0">
        <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-6">
            <p className="eyebrow">Packet status</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">
              {roleplay ? "Generated" : "Waiting"}
            </p>
            <p className="mt-2 text-base leading-7 text-muted">
              Create the participant-facing packet before anything judge-side appears.
            </p>
          </div>
          <div className="p-6">
            <p className="eyebrow">Your response</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">
              {responseText.trim().length} chars
            </p>
            <p className="mt-2 text-base leading-7 text-muted">
              Answer in your own words, then submit to reveal the evaluation panel.
            </p>
          </div>
          <div className="p-6">
            <p className="eyebrow">Judge feedback</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">
              {evaluation ? "Unlocked" : "Hidden"}
            </p>
            <p className="mt-2 text-base leading-7 text-muted">
              Follow-up questions, scoring, and coaching notes appear after submission.
            </p>
          </div>
        </div>
      </section>

      {viewer ? (
        <div className="rounded-[1.6rem] border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800 shadow-card">
          Signed in as <span className="font-semibold">{viewer.email}</span>. PrepPlay can save your generated
          rounds and work harder to avoid repeated roleplay situations for your account.
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-card">
          You are practicing as a guest. Your progress is not being saved, and you may get repeated roleplays.
          <Link href="/login" className="ml-2 font-semibold text-amber-950 underline underline-offset-4">
            Log in or sign up
          </Link>
          {" "}to reduce repeats.
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
        <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-card">
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

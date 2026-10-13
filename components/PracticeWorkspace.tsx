"use client";

import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Tag } from "@/components/ds/Tag";
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

  const steps = [
    { title: "Participant packet", active: phase >= 1 },
    { title: "Your response", active: phase >= 2 },
    { title: "Judge evaluation", active: phase >= 3 }
  ];
  const statuses = [
    { label: "Packet status", value: roleplay ? "Generated" : "Waiting", muted: !roleplay },
    { label: "Your response", value: `${responseText.trim().length} chars`, muted: responseText.trim().length === 0 },
    { label: "Judge feedback", value: evaluation ? "Unlocked" : "Hidden", muted: !evaluation }
  ];

  return (
    <div className="space-y-10 pb-8">
      <header className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Build the round before you unlock the scoring.</h1>
          <p className="text-fg">
            Generate a participant packet, answer in your own words, then unlock judge-side scoring only after you commit
            to your response.
          </p>
          {selectedEvent ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Tag tone="brand">{selectedEvent.name}</Tag>
              <Tag>{request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)}</Tag>
              <Tag>{request.numberOfPis} PIs</Tag>
            </div>
          ) : null}
        </div>

        <ol aria-label="Practice steps" className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} aria-current={phase === index + 1 ? "step" : undefined} className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-small font-extrabold ${
                  step.active ? "bg-brand text-white" : "bg-surface text-fg-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className="leading-tight">
                <span className="block text-label font-bold text-fg-muted">Phase {index + 1}</span>
                <span className={`block text-small font-extrabold ${step.active ? "text-fg" : "text-fg-muted"}`}>{step.title}</span>
              </span>
            </li>
          ))}
        </ol>

        <dl className="grid divide-y-[1.5px] divide-rule rounded-card border-[1.5px] border-rule sm:grid-cols-3 sm:divide-x-[1.5px] sm:divide-y-0">
          {statuses.map((item) => (
            <div key={item.label} className="px-5 py-4">
              <dt className="text-label font-bold text-fg-muted">{item.label}</dt>
              <dd className={`mt-1 font-display text-h3 font-extrabold tabular-nums ${item.muted ? "text-fg-muted" : "text-fg"}`}>{item.value}</dd>
            </div>
          ))}
        </dl>

        {viewer ? (
          <p className="flex items-center gap-2.5 rounded-control bg-correct-tint px-4 py-3 text-small text-fg">
            <CheckCircleIcon size={20} weight="fill" aria-hidden="true" className="shrink-0 text-correct" />
            <span>
              Signed in as <span className="font-bold">{viewer.email}</span>. PrepPlay works harder to avoid repeated situations for
              your account.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2.5 rounded-control bg-surface px-4 py-3 text-small text-fg">
            <InfoIcon size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0 text-fg-muted" />
            <span>
              Practicing as a guest — progress not saved, repeats possible.{" "}
              <Link href="/login" className="font-bold text-brand-text underline underline-offset-4">
                Log in or sign up
              </Link>{" "}
              to reduce repeats.
            </span>
          </p>
        )}
      </header>

      <RoleplayForm
        value={request}
        options={options}
        onChange={setRequest}
        onSubmit={handleGenerate}
        isLoading={isGenerating}
      />

      {errorMessage ? (
        <p role="alert" className="flex items-center gap-2.5 rounded-control bg-wrong-tint px-4 py-3 text-small font-bold text-wrong-text">
          <WarningCircleIcon size={20} weight="bold" aria-hidden="true" className="shrink-0" />
          {errorMessage}
        </p>
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

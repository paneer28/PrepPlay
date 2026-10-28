"use client";

import { ChartBarIcon, ChatTextIcon, CheckCircleIcon, FileTextIcon, InfoIcon, LockSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ds/Button";
import { Tag } from "@/components/ds/Tag";
import { EmptyState } from "@/components/EmptyState";
import { JudgeEvaluationCard } from "@/components/JudgeEvaluationCard";
import { LoadingState } from "@/components/LoadingState";
import { ParticipantPacket } from "@/components/ParticipantPacket";
import { ResponseBox } from "@/components/ResponseBox";
import { RoleplayForm } from "@/components/RoleplayForm";
import { LIMITS } from "@/lib/config";
import { eventFormat } from "@/lib/roleplay/format";
import type { JudgeEvaluation, ParticipantRoleplay, PracticeOptions, RoleplayRequest, Viewer } from "@/types";

type MyEvent = { clusterId: string; eventId: string | null };

type PracticeWorkspaceProps = {
  options: PracticeOptions;
  viewer: Viewer | null;
  // The viewer's event, which the form starts on (eventId is null when only the cluster is known).
  myEvent?: MyEvent | null;
};

function createInitialRequest(options: PracticeOptions, myEvent: MyEvent | null): RoleplayRequest {
  const firstCluster = options.clusters.find((cluster) => cluster.id === myEvent?.clusterId) ?? options.clusters[0];
  const firstEvent =
    options.events.find((event) => event.id === myEvent?.eventId && event.clusterId === firstCluster.id) ??
    options.events.find((event) => event.clusterId === firstCluster.id) ??
    options.events[0];

  return {
    eventId: firstEvent.id,
    clusterId: firstCluster.id,
    difficulty: "medium",
    industry: "",
    instructionalAreaPreference: "",
    specificPerformanceIndicatorIds: [],
    numberOfPis: eventFormat(firstEvent.id).pis
  };
}

export function PracticeWorkspace({ options, viewer, myEvent = null }: PracticeWorkspaceProps) {
  const [request, setRequest] = useState<RoleplayRequest>(() => createInitialRequest(options, myEvent));
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

  const responseLength = responseText.trim().length;
  const steps = [
    {
      title: "Participant packet",
      status: roleplay ? "Generated" : "Waiting",
      done: Boolean(roleplay),
      icon: FileTextIcon,
      tone: "bg-brand-tint text-brand-text"
    },
    {
      title: "Your response",
      status: `${responseLength} chars`,
      done: responseLength > 0,
      icon: ChatTextIcon,
      tone: "bg-streak-tint text-streak-text"
    },
    {
      title: "Judge evaluation",
      status: evaluation ? "Unlocked" : "Hidden",
      done: Boolean(evaluation),
      icon: evaluation ? ChartBarIcon : LockSimpleIcon,
      tone: "bg-correct-tint text-correct-text"
    }
  ];

  return (
    <div className="space-y-10 pb-8">
      <header className="max-w-3xl space-y-3">
        <Tag tone="brand">Roleplay practice</Tag>
        <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[44px]">
          Build the round before you unlock the scoring.
        </h1>
        <p className="text-fg">
          Generate a participant packet, answer in your own words, then unlock judge-side scoring only after you commit to your
          response.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <RoleplayForm value={request} options={options} onChange={setRequest} />

        {/* Your round: steps, current setup, and the one main action */}
        <aside aria-label="Your round" className="space-y-5 rounded-[20px] border-[1.5px] border-rule bg-page p-6 shadow-[0_6px_0_var(--rule)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-h3 font-extrabold text-fg">Your round</h2>
            <span className="text-label font-bold text-fg-muted">Phase {phase} of 3</span>
          </div>

          <ol className="relative space-y-4">
            <span aria-hidden="true" className="absolute bottom-5 left-[21px] top-5 w-[2px] bg-rule" />
            {steps.map((step, index) => (
              <li key={step.title} aria-current={phase === index + 1 ? "step" : undefined} className="relative flex items-center gap-3">
                <span
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-control border-[1.5px] ${
                    phase >= index + 1 ? `${step.tone} border-transparent` : "border-rule bg-page text-fg-muted"
                  } ${phase === index + 1 ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
                >
                  <step.icon size={20} weight="bold" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label font-bold text-fg-muted">Step {index + 1}</span>
                  <span className={`block font-extrabold ${phase >= index + 1 ? "text-fg" : "text-fg-muted"}`}>{step.title}</span>
                </span>
                <span className={`text-label font-extrabold tabular-nums ${step.done ? "text-correct-text" : "text-fg-muted"}`}>{step.status}</span>
              </li>
            ))}
          </ol>

          {selectedEvent ? (
            <div className="space-y-2 border-t-[1.5px] border-rule pt-4">
              <p className="text-label font-bold text-fg-muted">This round</p>
              <div className="flex flex-wrap gap-2">
                <Tag tone="brand" className="whitespace-normal">
                  {selectedEvent.name}
                </Tag>
                <Tag>{request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)}</Tag>
                <Tag>{request.numberOfPis} PIs</Tag>
              </div>
            </div>
          ) : null}

          <Button size="lg" block onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : roleplay ? "Generate a new roleplay" : "Generate Roleplay"}
          </Button>

          {viewer ? (
            <p className="flex items-start gap-2 text-label font-semibold text-fg-muted">
              <CheckCircleIcon size={16} weight="fill" aria-hidden="true" className="mt-px shrink-0 text-correct" />
              <span>
                Signed in as <span className="font-extrabold text-fg">{viewer.email}</span>. PrepPlay works harder to avoid repeated
                situations for your account.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 text-label font-semibold text-fg-muted">
              <InfoIcon size={16} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              <span>
                Practicing as a guest — progress not saved, repeats possible.{" "}
                <Link href="/login" className="font-extrabold text-brand-text underline underline-offset-2">
                  Log in or sign up
                </Link>{" "}
                to reduce repeats.
              </span>
            </p>
          )}
        </aside>
      </div>

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

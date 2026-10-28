"use client";

import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { ClusterIcon } from "@/components/ds/ClusterIcon";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { ProgressRing } from "@/components/ds/ProgressRing";
import { Tag } from "@/components/ds/Tag";
import { useTestStatuses } from "@/components/TestLibrary";
import { originalSetHref, originalSetLabel } from "@/lib/question-sets";
import type { PracticeTestSummary } from "@/types";

// Saved results for signed-in users (from the database), keyed by set id.
export type SetProgress = Record<string, { attempts: number; bestPct: number | null; lastAt: string }>;
export type SourceProgress = Record<string, { answered: number; correct: number }>;

export type ClusterCard = { slug: string; label: string; cluster: string; sets: PracticeTestSummary[] };

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const scoreTone = (percent: number) => (percent >= 80 ? "text-correct-text" : percent < 60 ? "text-wrong-text" : "text-fg");

// The three big cluster cards on /learn: question count and accuracy
// so far (every answered question in the cluster's sets, or, for guests, the
// last score on each set finished in this browser). `myCluster` is the
// viewer's event's cluster, which gets a "Your event" tag.
export function ClusterCards({ clusters, sources, myCluster = null }: { clusters: ClusterCard[]; sources: SourceProgress | null; myCluster?: string | null }) {
  const allSets = clusters.flatMap((cluster) => cluster.sets);
  const local = useTestStatuses(allSets);

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {clusters.map((cluster) => {
        const questions = cluster.sets.reduce((sum, set) => sum + set.questionCount, 0);
        let answered = 0;
        let correct = 0;
        for (const set of cluster.sets) {
          if (sources) {
            answered += sources[set.id]?.answered ?? 0;
            correct += sources[set.id]?.correct ?? 0;
          } else {
            const status = local.get(set.id);
            if (status?.kind === "completed" && status.correct !== null) {
              answered += status.total;
              correct += status.correct;
            }
          }
        }
        const accuracy = answered ? Math.round((correct / answered) * 100) : null;

        return (
          <li key={cluster.slug}>
            <Link
              href={`/learn/${cluster.slug}`}
              className="group flex h-full flex-col rounded-card border-[1.5px] border-rule bg-page p-6 shadow-[0_4px_0_var(--rule)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <ClusterIcon cluster={cluster.cluster} size={56} />
                {cluster.cluster === myCluster ? <Tag tone="brand">Your event</Tag> : null}
              </div>
              <h2 className="mt-5 font-display text-h3 font-extrabold text-fg">{cluster.label}</h2>
              <p className="mt-1 text-small font-semibold text-fg-muted">
                {questions} questions · {cluster.sets.length} sets
              </p>
              <div className="mt-6 flex-1 space-y-2">
                <ProgressBar value={(accuracy ?? 0) / 100} tone="correct" label={`${cluster.label} accuracy`} />
                <p className="text-small font-bold text-fg">
                  {accuracy === null ? (
                    <span className="text-fg-muted">No answers yet</span>
                  ) : (
                    <>
                      <span className={`font-extrabold tabular-nums ${scoreTone(accuracy)}`}>{accuracy}%</span> accuracy
                      <span className="font-semibold text-fg-muted"> · {answered} answered</span>
                    </>
                  )}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 font-extrabold text-brand-text">
                See sets
                <ArrowRightIcon size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// One card per set: question count and time, then best score and when it was
// last tried (signed in), or the progress kept in this browser (guests).
export function SetCards({ sets, progress }: { sets: PracticeTestSummary[]; progress: SetProgress | null }) {
  const local = useTestStatuses(sets);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => {
        const saved = progress?.[set.id];
        const status = local.get(set.id) ?? null;
        const inProgress = status?.kind === "in-progress";
        const tried = Boolean(saved) || status?.kind === "completed";
        const bestPct = saved?.bestPct ?? (status?.kind === "completed" && status.correct !== null ? Math.round((status.correct / status.total) * 100) : null);

        return (
          <li key={set.id}>
            <Link
              href={originalSetHref(set.id)}
              className="group flex h-full flex-col rounded-card border-[1.5px] border-rule bg-page p-5 shadow-[0_4px_0_var(--rule)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-h4 font-extrabold text-fg">{originalSetLabel(set)}</h3>
                  <p className="mt-1 text-small font-semibold text-fg-muted">
                    {set.questionCount} questions · ~{set.timeLimitMinutes} min
                  </p>
                </div>
                {inProgress ? (
                  <ProgressRing value={status.answered / status.total} label={`In progress, ${status.answered} of ${status.total} answered`} />
                ) : tried ? (
                  <CheckCircleIcon size={28} weight="fill" aria-label="Tried" className="shrink-0 text-correct" />
                ) : null}
              </div>

              <div className="mt-5 flex flex-1 items-end justify-between gap-3">
                {bestPct !== null ? (
                  <p className="text-small font-semibold text-fg-muted">
                    <span className={`block font-display text-h3 font-extrabold tabular-nums ${scoreTone(bestPct)}`}>{Math.round(bestPct)}%</span>
                    {saved ? "Best score" : "Last score"}
                    {saved ? ` · last tried ${dateFormat.format(new Date(saved.lastAt))}` : ""}
                  </p>
                ) : inProgress ? (
                  <p className="text-small font-semibold text-fg-muted">
                    {status.answered} of {status.total} answered
                  </p>
                ) : (
                  <p className="text-small font-semibold text-fg-muted">Not tried yet</p>
                )}
                <span className="inline-flex shrink-0 items-center gap-1 font-extrabold text-brand-text">
                  {inProgress ? "Resume" : tried ? "Retake" : "Start set"}
                  <ArrowRightIcon size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useMemo } from "react";
import type { PracticeOptions, RoleplayRequest } from "@/types";

type RoleplayFormProps = {
  value: RoleplayRequest;
  options: PracticeOptions;
  onChange: (next: RoleplayRequest) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

function getInstructionalAreaOptions(eventId: string, options: PracticeOptions) {
  return Array.from(
    new Set(
      options.performanceIndicators
        .filter((indicator) => indicator.eventIds.includes(eventId))
        .map((indicator) => indicator.instructionalArea?.trim())
        .filter((area): area is string => Boolean(area))
    )
  ).sort((left, right) => left.localeCompare(right));
}

function updateRequest(
  value: RoleplayRequest,
  patch: Partial<RoleplayRequest>,
  options: PracticeOptions
): RoleplayRequest {
  const next = { ...value, ...patch };
  const filteredEvents = options.events.filter((event) => event.clusterId === next.clusterId);
  const currentEventStillValid = filteredEvents.some((event) => event.id === next.eventId);

  if (!currentEventStillValid && filteredEvents[0]) {
    next.eventId = filteredEvents[0].id;
  }

  const instructionalAreaOptions = getInstructionalAreaOptions(next.eventId, options);

  if (
    next.instructionalAreaPreference.trim() &&
    !instructionalAreaOptions.includes(next.instructionalAreaPreference.trim())
  ) {
    next.instructionalAreaPreference = "";
  }

  next.specificPerformanceIndicatorIds = [];

  if (next.numberOfPis < 3) {
    next.numberOfPis = 3;
  }

  if (next.numberOfPis > 7) {
    next.numberOfPis = 7;
  }

  return next;
}
export function RoleplayForm({ value, options, onChange, onSubmit, isLoading }: RoleplayFormProps) {
  const clusterOptions = options.clusters;
  const eventOptions = useMemo(
    () => options.events.filter((event) => event.clusterId === value.clusterId),
    [options.events, value.clusterId]
  );
  const instructionalAreaOptions = useMemo(
    () => getInstructionalAreaOptions(value.eventId, options),
    [options, value.eventId]
  );

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Practice setup</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
              Build your next round
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
              Choose the roleplay lane, set the difficulty, and the app will randomly pull a relevant
              PI set for you every time.
            </p>
          </div>
          <div className="surface-soft min-w-[240px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">What happens</p>
            <p className="mt-2 text-sm leading-7 text-ink">
              Participant packet first. Judge materials stay hidden until you submit.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-7 sm:grid-cols-2 sm:p-9">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Cluster
          <select
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
            value={value.clusterId}
            onChange={(event) =>
              onChange(updateRequest(value, { clusterId: event.target.value }, options))
            }
          >
            {clusterOptions.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Event
          <select
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
            value={value.eventId}
            onChange={(event) =>
              onChange(updateRequest(value, { eventId: event.target.value }, options))
            }
          >
            {eventOptions.map((eventOption) => (
              <option key={eventOption.id} value={eventOption.id}>
                {eventOption.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Difficulty
          <select
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
            value={value.difficulty}
            onChange={(event) =>
              onChange(
                updateRequest(
                  value,
                  { difficulty: event.target.value as RoleplayRequest["difficulty"] },
                  options
                )
              )
            }
          >
            {options.difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Instructional area
          <select
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
            value={value.instructionalAreaPreference}
            onChange={(event) =>
              onChange(
                updateRequest(
                  value,
                  { instructionalAreaPreference: event.target.value },
                  options
                )
              )
            }
          >
            <option value="">Automatic / scenario-based</option>
            {instructionalAreaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Number of PIs
          <select
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition focus:border-accent"
            value={value.numberOfPis}
            onChange={(event) =>
              onChange(updateRequest(value, { numberOfPis: Number(event.target.value) }, options))
            }
          >
            {[3, 4, 5, 6, 7].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
          Industry or business type (optional)
          <input
            className="rounded-[1.1rem] border border-line bg-[#fcfdff] px-4 py-3.5 text-base font-normal outline-none transition placeholder:text-muted/70 focus:border-accent"
            placeholder="Example: boutique hotel, veterinary clinic, credit union"
            value={value.industry}
            onChange={(event) =>
              onChange(updateRequest(value, { industry: event.target.value }, options))
            }
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-line/80 bg-[#fafcff] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">PI selection</p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            Keep it on automatic for scenario-driven PI selection, or choose an instructional area to make that the dominant source for the packet while still keeping the full set relevant to the scenario.
          </p>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Generating..." : "Generate Roleplay"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Button } from "@/components/ds/Button";
import { FieldLabel, Select, TextInput } from "@/components/ds/Field";
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
    <section aria-labelledby="setup-title" className="card space-y-6 sm:p-8">
      <div className="space-y-2">
        <h2 id="setup-title" className="font-display text-h2 font-extrabold text-fg">
          Build your next round
        </h2>
        <p className="max-w-3xl text-fg">
          Choose the roleplay lane, set the difficulty, and the app will randomly pull a relevant PI set for you every time.
        </p>
        <p className="flex items-center gap-2 text-small font-bold text-fg-muted">
          <InfoIcon size={18} weight="bold" aria-hidden="true" />
          Participant packet first. Judge materials stay hidden until you submit.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldLabel label="Cluster">
          <Select value={value.clusterId} onChange={(event) => onChange(updateRequest(value, { clusterId: event.target.value }, options))}>
            {clusterOptions.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.label}
              </option>
            ))}
          </Select>
        </FieldLabel>

        <FieldLabel label="Event">
          <Select value={value.eventId} onChange={(event) => onChange(updateRequest(value, { eventId: event.target.value }, options))}>
            {eventOptions.map((eventOption) => (
              <option key={eventOption.id} value={eventOption.id}>
                {eventOption.name}
              </option>
            ))}
          </Select>
        </FieldLabel>

        <FieldLabel label="Difficulty">
          <Select
            value={value.difficulty}
            onChange={(event) =>
              onChange(updateRequest(value, { difficulty: event.target.value as RoleplayRequest["difficulty"] }, options))
            }
          >
            {options.difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </Select>
        </FieldLabel>

        <FieldLabel label="Instructional area">
          <Select
            value={value.instructionalAreaPreference}
            onChange={(event) => onChange(updateRequest(value, { instructionalAreaPreference: event.target.value }, options))}
          >
            <option value="">Automatic / scenario-based</option>
            {instructionalAreaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
        </FieldLabel>

        <FieldLabel label="Number of PIs">
          <Select value={value.numberOfPis} onChange={(event) => onChange(updateRequest(value, { numberOfPis: Number(event.target.value) }, options))}>
            {[3, 4, 5, 6, 7].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Select>
        </FieldLabel>

        <FieldLabel label="Industry or business type (optional)" className="sm:col-span-2">
          <TextInput
            placeholder="Example: boutique hotel, veterinary clinic, credit union"
            value={value.industry}
            onChange={(event) => onChange(updateRequest(value, { industry: event.target.value }, options))}
          />
        </FieldLabel>
      </div>

      <div className="flex flex-col gap-4 border-t-[1.5px] border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-small font-extrabold text-fg">PI selection</p>
          <p className="mt-1 text-small text-fg-muted">
            Keep it on automatic for scenario-driven PI selection, or choose an instructional area to make that the dominant source for
            the packet while still keeping the full set relevant to the scenario.
          </p>
        </div>
        <Button size="lg" onClick={onSubmit} disabled={isLoading} className="shrink-0">
          {isLoading ? "Generating..." : "Generate Roleplay"}
        </Button>
      </div>
    </section>
  );
}

"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { FieldLabel, Select, TextInput } from "@/components/ds/Field";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { eventFormat } from "@/lib/roleplay/format";
import type { PracticeOptions, RoleplayRequest } from "@/types";

type RoleplayFormProps = {
  value: RoleplayRequest;
  options: PracticeOptions;
  onChange: (next: RoleplayRequest) => void;
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

  // A new event starts at its standard PI count; the user can still change it after.
  if (next.eventId !== value.eventId) {
    next.numberOfPis = eventFormat(next.eventId).pis;
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
export function RoleplayForm({ value, options, onChange }: RoleplayFormProps) {
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
    <section aria-labelledby="setup-title" className="space-y-6 rounded-[20px] border-[1.5px] border-rule bg-page p-6 shadow-[0_6px_0_var(--rule)] sm:p-8">
      <div className="space-y-1.5">
        <h2 id="setup-title" className="font-display text-h3 font-extrabold text-fg">
          Build your next round
        </h2>
        <p className="text-small text-fg">
          Choose the roleplay lane, set the difficulty, and the app will randomly pull a relevant PI set for you every time.
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-label font-bold text-fg-muted">Difficulty</span>
          <SegmentedControl<RoleplayRequest["difficulty"]>
            label="Difficulty"
            block
            value={value.difficulty}
            onChange={(difficulty) => onChange(updateRequest(value, { difficulty }, options))}
            items={options.difficulties.map((difficulty) => ({ value: difficulty.value, label: difficulty.label }))}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-label font-bold text-fg-muted">Number of PIs</span>
          <SegmentedControl<string>
            label="Number of PIs"
            block
            value={String(value.numberOfPis)}
            onChange={(count) => onChange(updateRequest(value, { numberOfPis: Number(count) }, options))}
            items={[3, 4, 5, 6, 7].map((count) => ({ value: String(count), label: String(count) }))}
          />
        </div>
      </div>

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

      <FieldLabel label="Industry or business type (optional)">
        <TextInput
          placeholder="Example: boutique hotel, veterinary clinic, credit union"
          value={value.industry}
          onChange={(event) => onChange(updateRequest(value, { industry: event.target.value }, options))}
        />
      </FieldLabel>

      <p className="flex items-start gap-2 border-t-[1.5px] border-rule pt-5 text-label font-semibold text-fg-muted">
        <InfoIcon size={16} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
        <span>
          Participant packet first. Judge materials stay hidden until you submit. Keep the instructional area on automatic for
          scenario-driven PI selection, or choose one to make it the dominant source for the packet.
        </span>
      </p>
    </section>
  );
}

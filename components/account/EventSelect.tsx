import type { ComponentProps } from "react";
import { Select } from "@/components/ds/Field";
import { DECA_EVENT_GROUPS } from "@/lib/deca-events";

// Every event someone can pick as theirs, grouped by cluster.
export function EventSelect({ placeholder = "Choose your event", ...props }: { placeholder?: string } & ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <option value="">{placeholder}</option>
      {DECA_EVENT_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

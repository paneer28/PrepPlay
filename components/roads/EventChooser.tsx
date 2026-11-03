"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setViewerEvent } from "@/app/account/event-actions";
import { EventPicker } from "@/components/account/EventPicker";

// The event picker that works for everyone, in the header and on the roads.
// Changing it refreshes the page, which then filters to the new event.
export function EventChooser({ eventId, compact = false, id }: { eventId: string | null; compact?: boolean; id?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(eventId ?? "");
  const [pending, startTransition] = useTransition();
  // Follows changes from elsewhere (the dashboard, the welcome prompt, the other picker).
  const [seen, setSeen] = useState(eventId);
  if (eventId !== seen) {
    setSeen(eventId);
    setValue(eventId ?? "");
  }

  return (
    <EventPicker
      id={id}
      label="Your event"
      compact={compact}
      value={value}
      disabled={pending}
      onChange={(next) => {
        const previous = value;
        setValue(next);
        startTransition(async () => {
          const result = await setViewerEvent(next || null).catch(() => "error" as const);
          if (result === "saved") router.refresh();
          else setValue(previous);
        });
      }}
    />
  );
}

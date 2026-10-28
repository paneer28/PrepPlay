"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDecaEvent } from "@/app/account/event-actions";
import { EventPicker } from "@/components/account/EventPicker";

// The dashboard's "My event" picker. Saves as soon as it changes.
export function EventSetting({ eventId }: { eventId: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(eventId ?? "");
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const change = (next: string) => {
    const previous = value;
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      const result = await saveDecaEvent(next || null).catch(() => "error" as const);
      if (result === "saved") {
        setMessage({ tone: "ok", text: next ? "Saved. Exams, practice questions and roleplays now start on your event." : "Saved." });
        router.refresh();
      } else {
        setValue(previous);
        setMessage({
          tone: "error",
          text: result === "unavailable" ? "Events aren't set up on this site yet." : "Couldn't save your event. Try again in a moment."
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span aria-hidden="true" className="text-small font-bold text-fg">
        My event
      </span>
      <div className="sm:w-[460px]">
        <EventPicker label="My event" value={value} disabled={pending} onChange={change} />
      </div>
      {message ? (
        <p role="status" className={`text-small font-bold ${message.tone === "error" ? "text-wrong-text" : "text-correct-text"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

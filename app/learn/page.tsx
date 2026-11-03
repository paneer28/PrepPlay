import type { Metadata } from "next";
import { EventChooser } from "@/components/roads/EventChooser";
import { RoadView } from "@/components/roads/RoadView";
import { LearnTabs } from "@/components/roads/SubTabs";
import { getViewerEvent } from "@/lib/profile";
import { examRoadFor, getRoadProgress } from "@/lib/roads";

export const metadata: Metadata = {
  title: "Learn | PrepPlay",
  description: "A guided road through every performance indicator on your DECA exam, most-tested first, with flashcards and practice questions for each one."
};

export default async function ExamRoadPage() {
  const [event, saved] = await Promise.all([getViewerEvent(), getRoadProgress()]);
  const road = examRoadFor(event);

  const unlimitedHref = `/exams/unlimited?start=1${event ? `&cluster=${encodeURIComponent(event.examCluster)}` : ""}`;

  const count = road ? road.units.reduce((sum, item) => sum + item.stops.filter((stop) => stop.kind !== "checkpoint").length, 0) : 0;

  return (
    <div data-road="exam" className="space-y-6 pb-10">
      <LearnTabs active="exam" />

      {road && event ? (
        <>
          <header className="max-w-2xl space-y-1">
            <p className="text-small font-bold text-brand-text">
              {event.code} · {event.name}
            </p>
            <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Exam road</h1>
            <p className="text-fg">
              {count} indicators can appear on your exam, with the most-tested first. Every event on the {event.examCluster} exam shares this road.
            </p>
          </header>
          <RoadView key={event.code} road={road} saved={saved} unlimitedHref={unlimitedHref} />
        </>
      ) : (
        <section className="mx-auto max-w-xl space-y-4 rounded-card bg-surface px-6 py-10 text-center">
          <h1 className="font-display text-h2 font-extrabold text-fg">{event ? "This event's road is coming" : "Pick your event to see your road"}</h1>
          <p className="text-fg">
            {event
              ? `${event.name} has its own indicator list, which isn't on PrepPlay yet. Pick another event, or use Tests, Custom and Infinite.`
              : "Your exam road is built from the indicators on your event's exam. You can also practice without an event in Tests, Custom and Infinite."}
          </p>
          <div className="mx-auto max-w-sm text-left">
            <EventChooser eventId={event?.id ?? null} />
          </div>
        </section>
      )}
    </div>
  );
}

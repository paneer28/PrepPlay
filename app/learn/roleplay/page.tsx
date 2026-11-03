import type { Metadata } from "next";
import { ButtonLink } from "@/components/ds/Button";
import { EventChooser } from "@/components/roads/EventChooser";
import { RoadView } from "@/components/roads/RoadView";
import { LearnTabs } from "@/components/roads/SubTabs";
import { getViewerEvent } from "@/lib/profile";
import { buildRoleplayRoad, getLearnEvent, getRoadProgress } from "@/lib/roads";

export const metadata: Metadata = {
  title: "Roleplay Road | PrepPlay",
  description: "A road through your DECA roleplay's performance indicators: Districts, then State, then ICDC, with flashcard decks and mini roleplays."
};

export default async function RoleplayRoadPage() {
  const [event, saved] = await Promise.all([getViewerEvent(), getRoadProgress()]);
  const learnEvent = event ? getLearnEvent(event.code) : null;
  const road = learnEvent ? buildRoleplayRoad(learnEvent) : null;
  const examOnly = Boolean(learnEvent && !road);

  return (
    <div data-road="roleplay" className="space-y-6 pb-10">
      <LearnTabs active="roleplay" />

      {road && event && learnEvent ? (
        <>
          <header className="max-w-2xl space-y-1">
            <p className="text-small font-bold text-[var(--road-text)]">
              {event.code} · {event.name}
            </p>
            <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">Roleplay road</h1>
            <p className="text-fg">
              Start with the areas DECA named for your District roleplay, then open your full list of {learnEvent.rolePlayPIs.length} indicators for State and ICDC.
              {learnEvent.rolePlayOnlyPIs.length ? ` ${learnEvent.rolePlayOnlyPIs.length} of them are roleplay-only, so they won't be on your exam.` : ""}
            </p>
          </header>
          <RoadView key={event.code} road={road} saved={saved} />
        </>
      ) : (
        <section className="mx-auto max-w-xl space-y-4 rounded-card bg-surface px-6 py-10 text-center">
          <h1 className="font-display text-h2 font-extrabold text-fg">
            {examOnly ? `${event!.code} has no roleplay road` : event ? "This event's road is coming" : "Pick your event to see your road"}
          </h1>
          <p className="text-fg">
            {examOnly
              ? `${event!.name} is presented to judges rather than built from a list of performance indicators, so there's nothing to work through here. Your exam road is ready, and you can still practice roleplays.`
              : event
                ? `${event.name} has its own indicator list, which isn't on PrepPlay yet. You can still practice roleplays.`
                : "Your road is built from the indicators your event's roleplay can use."}
          </p>
          {examOnly || event ? (
            <div className="flex flex-wrap justify-center gap-3">
              {examOnly ? <ButtonLink href="/learn">Go to my exam road</ButtonLink> : null}
              <ButtonLink href="/roleplays" variant="secondary">
                Practice a roleplay
              </ButtonLink>
            </div>
          ) : (
            <div className="mx-auto max-w-sm text-left">
              <EventChooser eventId={null} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

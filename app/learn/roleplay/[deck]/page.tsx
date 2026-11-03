import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlashcardDeck } from "@/components/roads/FlashcardDeck";
import { getViewerEvent } from "@/lib/profile";
import { buildRoleplayRoad, getFlashcard, getLearnEvent, getPi, getRoadProgress } from "@/lib/roads";

type Props = { params: Promise<{ deck: string }> };

export const metadata: Metadata = { title: "Roleplay road | PrepPlay", robots: { index: false } };

// Decks depend on the event, so a deck from another event goes back to the road.
export default async function DeckPage({ params }: Props) {
  const { deck } = await params;
  const event = await getViewerEvent();
  const learnEvent = event ? getLearnEvent(event.code) : null;
  const road = learnEvent ? buildRoleplayRoad(learnEvent) : null;
  const stop = road?.units.flatMap((unit) => unit.stops).find((item) => item.id === deck && item.kind === "deck");
  if (!stop || !learnEvent) redirect("/learn/roleplay");

  const only = new Set(learnEvent.rolePlayOnlyPIs);
  const cards = stop.codes.flatMap((code) => {
    const card = getFlashcard(code);
    const pi = getPi(code);
    return card && pi ? [{ code, front: card.front, back: card.back, area: pi.instructionalArea, roleplayOnly: only.has(code) }] : [];
  });

  const saved = await getRoadProgress();
  return <FlashcardDeck title={stop.title} cards={cards} savedItems={saved?.items ?? []} />;
}

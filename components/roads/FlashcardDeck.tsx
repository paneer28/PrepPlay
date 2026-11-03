"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ds/Button";
import { Illustration } from "@/components/ds/Illustration";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { Flashcard, type CardFace } from "@/components/roads/Flashcard";
import { LoadingState } from "@/components/LoadingState";
import { cardItem, loadLocalProgress, markRoadItems } from "@/lib/road-shared";


// A roleplay road stop: go through the deck, and cards marked "Still learning"
// come back at the end until they're all known.
//
// Cards learned at an earlier level are skipped, unless the whole deck is known
// (then it's a review). Rendered client-only (see below): it reads this browser's progress.
function Deck({ title, cards, savedItems }: { title: string; cards: CardFace[]; savedItems: string[] }) {
  const [queue, setQueue] = useState(() => {
    const learned = new Set([...savedItems, ...loadLocalProgress().items]);
    const remaining = cards.filter((card) => !learned.has(cardItem(card.code)));
    return remaining.length ? remaining : cards;
  });
  const [flipped, setFlipped] = useState(false);
  const known = cards.length - queue.length;

  const answer = (gotIt: boolean) => {
    const [card, ...rest] = queue;
    if (gotIt) void markRoadItems([cardItem(card.code)]);
    setQueue(gotIt ? rest : [...rest, card]);
    setFlipped(false);
  };

  const back = (
    <Link href="/learn/roleplay" className="inline-flex items-center gap-1.5 rounded-control text-small font-bold text-[var(--road-text)] hover:underline">
      <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
      Roleplay road
    </Link>
  );

  if (queue.length === 0) {
    return (
      <div data-road="roleplay" className="mx-auto max-w-[720px] space-y-6 pb-10">
        {back}
        <div className="flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center">
          <Illustration kind="trophy" size={120} />
          <h1 className="mt-4 font-display text-h2 font-extrabold text-fg">Deck finished</h1>
          <p className="mt-1 text-fg">
            You know all {cards.length} {cards.length === 1 ? "indicator" : "indicators"} in this deck.
          </p>
          <ButtonLink href="/learn/roleplay" size="lg" className="btn-road mt-6">
            Back to the road
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div data-road="roleplay" className="mx-auto max-w-[720px] space-y-6 pb-10">
      {back}
      <header className="space-y-3">
        <h1 className="font-display text-h3 font-extrabold text-fg">{title}</h1>
        <div className="flex items-center gap-3">
          <ProgressBar value={known / cards.length} tone="road" label="Deck progress" />
          <span className="shrink-0 text-small font-extrabold tabular-nums text-fg-muted">
            {known} of {cards.length}
          </span>
        </div>
      </header>

      <Flashcard card={queue[0]} flipped={flipped} onFlip={() => setFlipped((value) => !value)} />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={() => answer(false)}>
          Still learning
        </Button>
        <Button size="lg" className="btn-road" onClick={() => answer(true)}>
          Got it
        </Button>
      </div>
    </div>
  );
}

export const FlashcardDeck = dynamic(() => Promise.resolve(Deck), { ssr: false, loading: () => <LoadingState label="Loading your deck" /> });

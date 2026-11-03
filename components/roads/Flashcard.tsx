"use client";

import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Tag } from "@/components/ds/Tag";

export type CardFace = { code: string; front: string; back: string; area: string; roleplayOnly?: boolean };

// One PI flashcard. A real button: pressing it (or Enter/Space) turns it over.
export function Flashcard({ card, flipped, onFlip }: { card: CardFace; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? "Show the performance indicator" : "Show the explanation"}
      className="flex min-h-[300px] w-full flex-col rounded-card border-[1.5px] border-rule bg-page p-5 text-left shadow-[0_4px_0_var(--rule)] transition-colors hover:border-rule-strong sm:p-8"
    >
      <span className="flex flex-wrap items-center gap-1.5">
        <Tag tone="brand">{card.code}</Tag>
        <Tag>{card.area}</Tag>
        {card.roleplayOnly ? <Tag tone="streak">Roleplay only: not on your exam</Tag> : null}
      </span>
      <span aria-live="polite" className="flex flex-1 items-center py-6">
        {flipped ? (
          <span className="text-body text-fg sm:text-[18px]">{card.back}</span>
        ) : (
          <span className="font-display text-h3 font-extrabold text-fg sm:text-h2">{card.front}</span>
        )}
      </span>
      <span className="inline-flex items-center gap-1.5 text-small font-bold text-fg-muted">
        <ArrowsClockwiseIcon size={16} weight="bold" aria-hidden="true" />
        {flipped ? "Turn back over" : "Turn over for the explanation"}
      </span>
    </button>
  );
}

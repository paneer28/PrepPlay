"use client";

import { ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { AchievementSticker } from "@/components/ds/AchievementSticker";
import { Confetti } from "@/components/ds/Confetti";
import type { Contributor } from "@/data/contributors";

// A playful, deterministic look per tile: its own hue and a slight tilt.
const HUES = [285, 25, 150, 210, 340, 85, 245, 180, 55, 310];
const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const tileColors = (hue: number) =>
  ({
    "--h": hue,
    background: "oklch(var(--area-tint-l) calc(var(--area-tint-c) * 2) var(--h))",
    borderColor: "oklch(var(--area-fill-l) var(--area-fill-c) var(--h))",
    boxShadow: "0 5px 0 oklch(calc(var(--area-fill-l) - 0.12) var(--area-fill-c) var(--h))"
  }) as CSSProperties;

export function ContributorWall({ people }: { people: Contributor[] }) {
  const [burst, setBurst] = useState(0);
  const [origin, setOrigin] = useState<{ x: number; y: number } | undefined>();
  // Fire the confetti from the centre of the tile that was tapped.
  const celebrate = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setBurst((value) => value + 1);
  };
  const [popped, setPopped] = useState<number | null>(null);

  return (
    <>
      <Confetti burst={burst} origin={origin} />
      <ul className="flex flex-wrap items-start justify-center gap-5">
        {people.map((person, index) => {
          const hue = HUES[index % HUES.length];
          const tilt = TILTS[index % TILTS.length];
          const Inner = (
            <>
              <span
                className="grid h-16 w-16 place-items-center rounded-full bg-page font-display text-h3 font-extrabold"
                style={{ color: "oklch(var(--area-text-l) var(--area-text-c) var(--h))" }}
                aria-hidden="true"
              >
                {person.emoji ?? initials(person.name)}
              </span>
              <span className="mt-4 block font-display text-h4 font-extrabold leading-tight text-fg">{person.name}</span>
              {person.role ? (
                <span className="mt-1 block text-small font-bold" style={{ color: "oklch(var(--area-text-l) var(--area-text-c) var(--h))" }}>
                  {person.role}
                </span>
              ) : null}
              {person.note ? <span className="mt-2 block text-label font-semibold text-fg-muted">{person.note}</span> : null}
              {person.stickers?.length ? (
                <span className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {person.stickers.map((sticker, stickerIndex) => (
                    <AchievementSticker key={sticker} tilt={stickerIndex % 2 ? "right" : "left"} size="sm">
                      {sticker}
                    </AchievementSticker>
                  ))}
                </span>
              ) : null}
              {person.link ? (
                <span className="absolute right-3 top-3 text-fg-muted" aria-hidden="true">
                  <ArrowUpRightIcon size={16} weight="bold" />
                </span>
              ) : null}
            </>
          );

          return (
            <motion.li
              key={`${person.name}-${index}`}
              className="w-[calc(50%-10px)] sm:w-[250px]"
              initial={{ opacity: 0, scale: 0.4, rotate: tilt * 4, y: 24 }}
              animate={
                popped === index
                  ? { opacity: 1, scale: [1, 1.12, 0.96, 1], rotate: [tilt, -tilt * 2, tilt * 1.5, tilt], y: 0 }
                  : { opacity: 1, scale: 1, rotate: tilt, y: 0 }
              }
              whileHover={{ scale: 1.04, rotate: 0, y: -6 }}
              whileTap={{ scale: 0.95 }}
              transition={
                popped === index
                  ? { duration: 0.5 }
                  : { type: "spring", bounce: 0.55, duration: 0.7, delay: 0.15 + index * 0.08 }
              }
              onAnimationComplete={() => popped === index && setPopped(null)}
            >
              {person.link ? (
                <a
                  href={person.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => celebrate(event.currentTarget)}
                  className="relative flex h-full flex-col items-center rounded-[20px] border-[1.5px] p-5 text-center"
                  style={tileColors(hue)}
                >
                  {Inner}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    setPopped(index);
                    celebrate(event.currentTarget);
                  }}
                  aria-label={`${person.name}${person.role ? `, ${person.role}` : ""}${person.stickers?.length ? `, ${person.stickers.join(", ")}` : ""}. Celebrate!`}
                  className="relative flex h-full w-full flex-col items-center rounded-[20px] border-[1.5px] p-5 text-center"
                  style={tileColors(hue)}
                >
                  {Inner}
                </button>
              )}
            </motion.li>
          );
        })}

        <motion.li
          className="w-[calc(50%-10px)] sm:w-[250px]"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.7, delay: 0.15 + people.length * 0.08 }}
        >
          <div className="flex h-full flex-col items-center justify-center rounded-[20px] border-[1.5px] border-dashed border-rule-strong p-5 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-fg-muted" aria-hidden="true">
              <PlusIcon size={26} weight="bold" />
            </span>
            <span className="mt-4 block font-display text-h4 font-extrabold text-fg">This could be you</span>
            <span className="mt-1 block text-small font-semibold text-fg-muted">Help make PrepPlay better</span>
          </div>
        </motion.li>
      </ul>
    </>
  );
}

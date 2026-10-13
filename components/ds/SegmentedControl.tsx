"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Item<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; href?: string; ariaLabel?: string };

type Props<T extends string> = {
  items: Item<T>[];
  value: T;
  onChange?: (value: T) => void;
  label: string; // accessible group name
  size?: "sm" | "md";
  block?: boolean;
  className?: string;
};

// A Surface track with the selected segment as a white raised tile. Items with
// an href render as links (page-level modes); otherwise as toggle buttons.
export function SegmentedControl<T extends string>({ items, value, onChange, label, size = "md", block = false, className = "" }: Props<T>) {
  const segment = (active: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-[1.5px] font-body font-bold transition-[background-color,color,box-shadow] duration-150 ${
      size === "sm" ? "min-h-8 px-2.5 text-label" : "min-h-10 px-4 text-small"
    } ${
      active
        ? "border-rule bg-raised text-fg shadow-[0_2px_0_var(--rule)]"
        : "border-transparent text-fg-muted hover:text-fg"
    }`;

  return (
    <div
      role="group"
      aria-label={label}
      className={`${block ? "flex w-full" : "inline-flex"} gap-1 rounded-control bg-surface p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.value === value;
        return item.href ? (
          <Link key={item.value} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.ariaLabel} className={segment(active)}>
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            aria-label={item.ariaLabel}
            onClick={() => onChange?.(item.value)}
            className={segment(active)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

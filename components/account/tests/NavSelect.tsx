"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// A <select> whose options are links: choosing one navigates (server-side filtering).
export function NavSelect({
  label,
  value,
  options
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; href: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`grid min-w-0 max-w-full gap-1.5 text-xs font-semibold text-muted ${pending ? "opacity-60" : ""}`}>
      {label}
      <select
        value={value}
        onChange={(event) => {
          const href = options.find((option) => option.value === event.target.value)?.href;
          if (href) startTransition(() => router.push(href, { scroll: false }));
        }}
        className="w-full max-w-full truncate rounded-[1.1rem] border border-line bg-[#fcfdff] px-3.5 py-2 text-sm font-normal text-ink outline-none transition focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

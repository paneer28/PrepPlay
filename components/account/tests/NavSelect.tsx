"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FieldLabel, Select } from "@/components/ds/Field";

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
    <FieldLabel label={label} className={`min-w-0 max-w-full ${pending ? "opacity-60" : ""}`}>
      <Select
        value={value}
        onChange={(event) => {
          const href = options.find((option) => option.value === event.target.value)?.href;
          if (href) startTransition(() => router.push(href, { scroll: false }));
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FieldLabel>
  );
}

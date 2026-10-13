import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentProps, ReactNode } from "react";

export function FieldLabel({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-label font-bold text-fg-muted">{label}</span>
      {children}
    </label>
  );
}

export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <span className={`relative block ${className}`}>
      <select className="field" {...props}>
        {children}
      </select>
      <CaretDownIcon size={16} weight="bold" aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
    </span>
  );
}

export function TextInput({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`field ${className}`} {...props} />;
}

export function Checkbox({ label, className = "", ...props }: { label: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 text-small font-semibold text-fg ${className}`}>
      <input type="checkbox" className="check" {...props} />
      {label}
    </label>
  );
}

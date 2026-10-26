import type { ReactNode } from "react";
import { Tag } from "@/components/ds/Tag";

// Shared layout for the privacy policy and terms pages.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-10">
      <header className="space-y-3">
        <Tag tone="brand">Legal</Tag>
        <h1 className="font-display text-h1 font-extrabold text-fg">{title}</h1>
        <p className="text-small text-fg-muted">Last updated {updated}</p>
      </header>
      <div className="space-y-6 text-fg [&_h2]:font-display [&_h2]:text-h3 [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_section]:space-y-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}

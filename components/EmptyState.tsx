import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Illustration } from "@/components/ds/Illustration";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-14 text-center">
      <Illustration kind="empty" size={120} />
      <h3 className="mt-5 font-display text-h3 font-extrabold text-fg">{title}</h3>
      <p className="mt-2 max-w-md text-fg">{description}</p>
      <p className="mt-5 inline-flex items-center gap-1.5 text-small font-bold text-fg-muted">
        <PlusIcon size={16} weight="bold" aria-hidden="true" />
        Choose your setup above to generate a packet
      </p>
    </div>
  );
}

import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Tag } from "@/components/ds/Tag";

// Shown once a chapter code has been entered. Just the icon until there's room.
export function ChapterBadge() {
  return (
    <Tag tone="correct" className="h-11 shrink-0 px-2.5" icon={<ShieldCheckIcon size={18} weight="fill" aria-hidden="true" />}>
      <span className="sr-only xl:not-sr-only">Chapter access on</span>
    </Tag>
  );
}

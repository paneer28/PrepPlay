"use client";

import { PlayIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { findResumable, RESUME_EVENT, type Resumable } from "@/lib/resume";

// Picks up the most recent unfinished practice set, custom practice session or
// exam. Progress lives in this browser, so it's filled in after mount; with
// nothing to resume the button isn't shown.
export function ContinueButton() {
  const pathname = usePathname();
  const [target, setTarget] = useState<Resumable | null>(null);

  useEffect(() => {
    const refresh = () => setTarget(findResumable());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(RESUME_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(RESUME_EVENT, refresh);
    };
  }, [pathname]);

  // Already on it: no need to offer it again.
  if (!target || pathname === target.href) return null;

  const detail = `${target.label} · ${target.answered}/${target.total}`;

  return (
    <Link href={target.href} aria-label={`Continue: ${detail}`} title={detail} className="btn btn-sm h-11 shrink-0 gap-2 px-3 sm:max-w-[240px] sm:justify-start">
      <PlayIcon size={16} weight="fill" aria-hidden="true" className="shrink-0" />
      <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
        <span className="text-[14px] font-extrabold">Continue</span>
        <span className="w-full truncate text-[12px] font-bold text-white/80">{detail}</span>
      </span>
    </Link>
  );
}

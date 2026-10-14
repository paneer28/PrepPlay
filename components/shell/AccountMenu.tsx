"use client";

import { CaretDownIcon, ChartBarIcon, SignOutIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/app/login/actions";
import { ThemeToggle } from "@/components/ds/ThemeToggle";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-small font-bold text-fg transition-colors hover:bg-surface";

export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${email}`}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-tint font-display text-h4 font-extrabold uppercase text-brand-text">
          {email.slice(0, 1)}
        </span>
        <CaretDownIcon size={14} weight="bold" aria-hidden="true" className={`hidden transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          id={menuId}
          className="animate-popover-in absolute right-0 top-[calc(100%+8px)] z-30 w-72 origin-top-right rounded-card border-[1.5px] border-rule bg-page p-2"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-label font-bold text-fg-muted">Signed in as</p>
            <p className="truncate text-small font-extrabold text-fg">{email}</p>
          </div>
          <hr className="divider my-1" />
          <Link href="/account" className={itemClass} onClick={() => setOpen(false)}>
            <ChartBarIcon size={18} weight="bold" aria-hidden="true" />
            Dashboard
          </Link>
          <hr className="divider my-1" />
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-small font-bold text-fg">Theme</span>
            <ThemeToggle />
          </div>
          <hr className="divider my-1" />
          <form action={signOutAction}>
            <button type="submit" className={itemClass}>
              <SignOutIcon size={18} weight="bold" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

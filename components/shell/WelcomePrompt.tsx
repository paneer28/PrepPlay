"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { saveDecaEvent } from "@/app/account/event-actions";
import { saveLeaderboardProfile } from "@/app/account/leaderboard-actions";
import { EventSelect } from "@/components/account/EventSelect";
import { Button } from "@/components/ds/Button";
import { normalizeDisplayName, validDisplayName } from "@/lib/leaderboard-shared";

const ACCOUNT_DISMISSED_KEY = "prepplay:account-prompt-dismissed";
const PROFILE_LATER_KEY = "prepplay:username-prompt-later";
const ACCOUNT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

// Pages where a prompt would get in the way.
const QUIET_PATHS = ["/login", "/auth", "/tests-access"];

const noop = () => () => {};

function accountSnoozedNow() {
  return Date.now() - Number(read(() => window.localStorage, ACCOUNT_DISMISSED_KEY) ?? 0) < ACCOUNT_SNOOZE_MS;
}

function profileLaterNow() {
  return Boolean(read(() => window.sessionStorage, PROFILE_LATER_KEY));
}

function read(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Storage blocked: the prompt may come back next page, which is fine.
  }
}

// Shown when the site opens: visitors are invited to make an account, and
// signed-in people are asked for whatever they haven't picked yet: a username
// and their event together, or just their event.
export function WelcomePrompt({ signedIn, needsUsername, needsEvent }: { signedIn: boolean; needsUsername: boolean; needsEvent: boolean }) {
  const pathname = usePathname();
  // Read from browser storage; the server render counts both as "hold off".
  const accountSnoozed = useSyncExternalStore(noop, accountSnoozedNow, () => true);
  const profileLater = useSyncExternalStore(noop, profileLaterNow, () => true);
  const [closed, setClosed] = useState(false);
  const setOpen = (value: boolean) => setClosed(!value);

  const quiet = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const open = !quiet && !closed && (signedIn ? (needsUsername || needsEvent) && !profileLater : !accountSnoozed);

  if (!open) return null;

  if (!signedIn) {
    const back = encodeURIComponent(pathname === "/" ? "/learn" : pathname);
    const close = () => {
      write(() => window.localStorage, ACCOUNT_DISMISSED_KEY, String(Date.now()));
      setOpen(false);
    };
    return (
      <PromptDialog title="Create your free PrepPlay account" onClose={close}>
        <p className="mt-2 text-fg">Save your scores, keep your streak going and show up on the leaderboard. It takes a minute.</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link href={`/login?next=${back}`} className="btn btn-lg flex-1" onClick={() => setOpen(false)}>
            Create account
          </Link>
          <Link href={`/login?mode=login&next=${back}`} className="btn btn-lg btn-secondary flex-1" onClick={() => setOpen(false)}>
            Log in
          </Link>
        </div>
        <button type="button" onClick={close} className="mt-3 min-h-11 w-full rounded-control text-small font-bold text-fg-muted hover:text-fg">
          Not now
        </button>
      </PromptDialog>
    );
  }

  return (
    <ProfileForm
      askName={needsUsername}
      askEvent={needsEvent}
      onLater={() => {
        write(() => window.sessionStorage, PROFILE_LATER_KEY, "1");
        setOpen(false);
      }}
      onSaved={() => setOpen(false)}
    />
  );
}

const NAME_RULES = "Use 3 to 20 letters, numbers, spaces, dots, dashes or underscores, starting with a letter or number.";

function ProfileForm({ askName, askEvent, onLater, onSaved }: { askName: boolean; askEvent: boolean; onLater: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorId = useId();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const username = normalizeDisplayName(name);
    if (askName && !validDisplayName(username)) return setError(NAME_RULES);
    if (askEvent && !eventId) return setError("Choose your event.");
    setSaving(true);
    setError(null);
    // The name goes first: if it's taken, nothing is saved and they can try another.
    if (askName) {
      // The leaderboard is on by default; people can hide themselves from the dashboard.
      const result = await saveLeaderboardProfile(username, true).catch(() => "error" as const);
      if (result !== "saved") {
        setSaving(false);
        return setError(
          result === "taken" ? "That username is taken. Try another." : result === "invalid" ? NAME_RULES : "Couldn't save your username right now. Try again in a moment."
        );
      }
    }
    if (askEvent) {
      const result = await saveDecaEvent(eventId).catch(() => "error" as const);
      if (result !== "saved") {
        setSaving(false);
        // The name (if any) is saved, so a retry only needs to ask for the event.
        if (askName) router.refresh();
        return setError("Couldn't save your event right now. Try again in a moment.");
      }
    }
    setSaving(false);
    onSaved();
    router.refresh();
  };

  return (
    <PromptDialog title={askName ? (askEvent ? "Set up your profile" : "Pick a username") : "What's your DECA event?"} onClose={onLater}>
      {askName ? (
        <p className="mt-2 text-fg">
          Your username is the name other students see on the leaderboard. Your email stays private. You can hide yourself from the leaderboard any
          time in your dashboard.
        </p>
      ) : null}
      {askEvent ? (
        <p className="mt-2 text-fg">
          Exams, practice questions and roleplays will start on your event. You can still switch to anything, or change your event in your
          dashboard.
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-5 space-y-3">
        {askName ? (
          <label className="grid gap-1.5">
            <span className="text-small font-bold text-fg">Username</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              autoComplete="username"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="field"
            />
          </label>
        ) : null}
        {askEvent ? (
          <label className="grid gap-1.5">
            <span className="text-small font-bold text-fg">Event</span>
            <EventSelect value={eventId} onChange={(event) => setEventId(event.target.value)} aria-describedby={error ? errorId : undefined} />
          </label>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-small font-bold text-wrong-text">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={saving || (askName && !name.trim()) || (askEvent && !eventId)}>
          {saving ? "Saving" : askName && !askEvent ? "Save username" : "Save"}
        </Button>
      </form>
      <button type="button" onClick={onLater} className="mt-3 min-h-11 w-full rounded-control text-small font-bold text-fg-muted hover:text-fg">
        Later
      </button>
    </PromptDialog>
  );
}

// A centered modal: focus moves in on open, Escape closes, and the page
// behind can't be tabbed to.
function PromptDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Runs once per open, so typing doesn't move focus around.
  useEffect(() => {
    const panel = panelRef.current;
    const previous = document.activeElement as HTMLElement | null;
    (panel?.querySelector<HTMLElement>("input, select, a, button") ?? panel)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("a, button, input, select")].filter((item) => !item.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="ds fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 animate-scrim-in sm:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-dialog-in w-full max-w-md rounded-card border-[1.5px] border-rule bg-page p-6 shadow-[0_6px_0_var(--rule)] sm:p-7"
      >
        <h2 id={titleId} className="font-display text-h3 font-extrabold text-fg">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

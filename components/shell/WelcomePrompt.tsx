"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { saveLeaderboardProfile } from "@/app/account/leaderboard-actions";
import { Button } from "@/components/ds/Button";
import { normalizeDisplayName, validDisplayName } from "@/lib/leaderboard-shared";

const ACCOUNT_DISMISSED_KEY = "prepplay:account-prompt-dismissed";
const USERNAME_LATER_KEY = "prepplay:username-prompt-later";
const ACCOUNT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

// Pages where a prompt would get in the way.
const QUIET_PATHS = ["/login", "/auth", "/tests-access"];

const noop = () => () => {};

function accountSnoozedNow() {
  return Date.now() - Number(read(() => window.localStorage, ACCOUNT_DISMISSED_KEY) ?? 0) < ACCOUNT_SNOOZE_MS;
}

function usernameLaterNow() {
  return Boolean(read(() => window.sessionStorage, USERNAME_LATER_KEY));
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
// signed-in people without a username are asked to pick one.
export function WelcomePrompt({
  signedIn,
  needsUsername,
  leaderboardOptIn
}: {
  signedIn: boolean;
  needsUsername: boolean;
  leaderboardOptIn: boolean;
}) {
  const pathname = usePathname();
  // Read from browser storage; the server render counts both as "hold off".
  const accountSnoozed = useSyncExternalStore(noop, accountSnoozedNow, () => true);
  const usernameLater = useSyncExternalStore(noop, usernameLaterNow, () => true);
  const [closed, setClosed] = useState(false);
  const setOpen = (value: boolean) => setClosed(!value);

  const quiet = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const open = !quiet && !closed && (signedIn ? needsUsername && !usernameLater : !accountSnoozed);

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
    <UsernameForm
      leaderboardOptIn={leaderboardOptIn}
      onLater={() => {
        write(() => window.sessionStorage, USERNAME_LATER_KEY, "1");
        setOpen(false);
      }}
      onSaved={() => setOpen(false)}
    />
  );
}

function UsernameForm({ leaderboardOptIn, onLater, onSaved }: { leaderboardOptIn: boolean; onLater: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorId = useId();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const username = normalizeDisplayName(name);
    if (!validDisplayName(username)) {
      setError("Use 3 to 20 letters, numbers, spaces, dots, dashes or underscores, starting with a letter or number.");
      return;
    }
    setSaving(true);
    setError(null);
    // Keeps the person's current leaderboard choice; this only sets the name.
    const result = await saveLeaderboardProfile(username, leaderboardOptIn).catch(() => "error" as const);
    setSaving(false);
    if (result === "saved") {
      onSaved();
      router.refresh();
    } else if (result === "taken") {
      setError("That username is taken. Try another.");
    } else if (result === "invalid") {
      setError("Use 3 to 20 letters, numbers, spaces, dots, dashes or underscores, starting with a letter or number.");
    } else {
      setError("Couldn't save your username right now. Try again in a moment.");
    }
  };

  return (
    <PromptDialog title="Pick a username" onClose={onLater}>
      <p className="mt-2 text-fg">This is the name other students see, like on the leaderboard. Your email stays private.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
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
        {error ? (
          <p id={errorId} role="alert" className="text-small font-bold text-wrong-text">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={saving || !name.trim()}>
          {saving ? "Saving" : "Save username"}
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
    (panel?.querySelector<HTMLElement>("input, a, button") ?? panel)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("a, button, input")].filter((item) => !item.hasAttribute("disabled"));
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

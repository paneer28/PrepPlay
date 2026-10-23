"use client";

import { useCallback, useEffect, useState } from "react";

// Full screen for the question screen, so the browser's tabs and address bar
// get out of the way. Works on computers and iPad. iPhone Safari doesn't let
// websites go full screen; there, PrepPlay added to the Home Screen opens
// without Safari's bars instead (see app/manifest.ts).

const PREFERENCE_KEY = "prepplay:fullscreen";

// Safari before 16.4 only has the webkit-prefixed versions.
type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const doc = () => document as WebkitDocument;

export function canFullscreen() {
  return typeof document !== "undefined" && Boolean(document.fullscreenEnabled || doc().webkitFullscreenEnabled);
}

export function isFullscreen() {
  return Boolean(document.fullscreenElement || doc().webkitFullscreenElement);
}

// Must be called from a tap or click; browsers refuse it otherwise.
export function enterFullscreen() {
  if (!canFullscreen() || isFullscreen()) return;
  const root = document.documentElement as WebkitElement;
  try {
    const result = root.requestFullscreen ? root.requestFullscreen({ navigationUI: "hide" }) : root.webkitRequestFullscreen?.();
    // A refusal isn't worth surfacing: the test works the same without it.
    void Promise.resolve(result).catch(() => {});
  } catch {
    // Same as above.
  }
}

export function exitFullscreen() {
  if (!isFullscreen()) return;
  try {
    const result = document.exitFullscreen ? document.exitFullscreen() : doc().webkitExitFullscreen?.();
    void Promise.resolve(result).catch(() => {});
  } catch {
    // Already out of full screen.
  }
}

// iPhone (and iPod) Safari outside the Home Screen app: the case where only
// adding PrepPlay to the Home Screen hides the browser bars.
export function shouldSuggestHomeScreen() {
  if (typeof window === "undefined" || canFullscreen()) return false;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
  return /iPhone|iPod/.test(navigator.userAgent) && !standalone;
}

export function loadFullscreenPreference() {
  try {
    return window.localStorage.getItem(PREFERENCE_KEY) === "on";
  } catch {
    return false;
  }
}

export function saveFullscreenPreference(on: boolean) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, on ? "on" : "off");
  } catch {
    // Storage can be blocked (private mode); the choice just won't be remembered.
  }
}

// Whether the page is full screen right now, kept in sync when the browser
// leaves full screen on its own (Esc, the system close button).
export function useFullscreen() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFullscreen());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !isFullscreen();
    if (next) enterFullscreen();
    else exitFullscreen();
    saveFullscreenPreference(next);
  }, []);

  return { active, toggle };
}

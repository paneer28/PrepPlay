"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { applyThemePreference, readThemePreference, THEME_EVENT, type ThemePreference } from "@/lib/theme";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useThemePreference() {
  return useSyncExternalStore(subscribe, readThemePreference, () => "system" as ThemePreference);
}

// Follow the system by default; Light or Dark overrides it on this device.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const preference = useThemePreference();

  return (
    <SegmentedControl<ThemePreference>
      label="Colour theme"
      size="sm"
      value={preference}
      onChange={applyThemePreference}
      className={className}
      items={[
        { value: "light", label: <SunIcon size={16} weight="bold" aria-hidden="true" />, ariaLabel: "Light theme" },
        { value: "dark", label: <MoonIcon size={16} weight="bold" aria-hidden="true" />, ariaLabel: "Dark theme" },
        { value: "system", label: <DesktopIcon size={16} weight="bold" aria-hidden="true" />, ariaLabel: "Match system theme" }
      ]}
    />
  );
}

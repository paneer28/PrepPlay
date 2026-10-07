import Link from "next/link";

const MODES = [
  { id: "full", href: "/tests", label: "Full test" },
  { id: "custom", href: "/tests/custom", label: "Custom practice" }
] as const;

// Compact segmented control for switching between the two practice test modes.
export function TestModeSwitch({ active }: { active: (typeof MODES)[number]["id"] }) {
  return (
    <nav
      aria-label="Practice test mode"
      className="inline-flex w-full rounded-full border border-line bg-[#f5f7fb] p-1 text-sm font-semibold sm:w-auto"
    >
      {MODES.map((mode) => {
        const isActive = mode.id === active;

        return (
          <Link
            key={mode.id}
            href={mode.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 rounded-full px-5 py-2 text-center transition sm:flex-none ${
              isActive ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}

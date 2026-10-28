"use client";

import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { createPortal } from "react-dom";
import { clusterHue } from "@/components/ds/ClusterIcon";
import { DECA_CLUSTERS, DECA_EVENTS, decaClusterById, decaEventById, type DecaEvent } from "@/lib/deca-events";

const PHONE_QUERY = "(max-width: 639px)";
const ANIMATION_MS = 120;

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isPhoneNow = () => window.matchMedia(PHONE_QUERY).matches;

// The cluster's site hue, for tinted code badges and dots.
const hueStyle = (event: Pick<DecaEvent, "clusterId">) => {
  const cluster = decaClusterById(event.clusterId);
  return { "--area-h": clusterHue(cluster?.examCluster ?? "") } as CSSProperties;
};

function matches(event: DecaEvent, query: string) {
  if (!query) return true;
  const cluster = decaClusterById(event.clusterId);
  return [event.name, event.shortName, event.code, cluster?.label ?? "", cluster?.short ?? ""].some((text) => text.toLowerCase().includes(query));
}

// Picks "my event". A button that opens a searchable list: a popover under the
// trigger on wider screens, a bottom sheet on phones. `value` is an event id
// ("" for none); `onChange` gets the new id ("" when cleared).
export function EventPicker({
  id,
  label,
  value,
  onChange,
  disabled = false
}: {
  id?: string;
  // What the picker is for, read out before the event ("Event", "My event").
  label: string;
  value: string;
  onChange: (eventId: string) => void;
  disabled?: boolean;
}) {
  const selected = decaEventById(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback((refocus: boolean) => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      if (refocus) triggerRef.current?.focus();
    }, ANIMATION_MS);
  }, []);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open && !closing}
        aria-label={`${label}: ${selected ? selected.name : "none picked"}`}
        title={selected?.name}
        onClick={() => (open ? close(false) : setOpen(true))}
        className="field flex h-12 items-center gap-2.5 pr-3 text-left disabled:cursor-wait disabled:opacity-70"
      >
        {selected ? (
          <>
            <CodeBadge event={selected} />
            <span className="min-w-0 flex-1 truncate text-fg">{selected.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-fg-muted">Pick your event</span>
        )}
        <CaretDownIcon size={16} weight="bold" aria-hidden="true" className="shrink-0 text-fg-muted" />
      </button>

      {open ? (
        <EventPanel
          triggerRef={triggerRef}
          value={value}
          closing={closing}
          onClose={close}
          onPick={(eventId) => {
            onChange(eventId);
            close(true);
          }}
        />
      ) : null}
    </div>
  );
}

function CodeBadge({ event, className = "" }: { event: DecaEvent; className?: string }) {
  return (
    <span
      className={`tag shrink-0 justify-center rounded-[6px] px-1.5 text-[12px] tracking-wide tabular-nums ${className}`}
      data-tone="area"
      style={hueStyle(event)}
      aria-hidden="true"
    >
      {event.code}
    </span>
  );
}

function ClusterDot({ clusterId }: { clusterId: string }) {
  return <span aria-hidden="true" className="area-fill size-2 shrink-0 rounded-full" style={hueStyle({ clusterId })} />;
}

type Placement = { left: number; width: number; maxHeight: number } & ({ top: number } | { bottom: number });

// Under the trigger (or above it when there's more room there), as wide as the
// trigger within 360-520px, and kept on screen.
function placeUnder(trigger: HTMLElement): Placement {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const margin = 8;
  const width = Math.min(Math.max(rect.width, 360), 520, window.innerWidth - margin * 2);
  const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
  const cap = Math.min(520, window.innerHeight * 0.7);
  const below = window.innerHeight - rect.bottom - gap - margin;
  const above = rect.top - gap - margin;
  if (below >= Math.min(cap, 320) || below >= above) {
    return { left, width, top: rect.bottom + gap, maxHeight: Math.min(cap, below) };
  }
  return { left, width, bottom: window.innerHeight - rect.top + gap, maxHeight: Math.min(cap, above) };
}

function EventPanel({
  triggerRef,
  value,
  closing,
  onClose,
  onPick
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  value: string;
  closing: boolean;
  onClose: (refocus: boolean) => void;
  onPick: (eventId: string) => void;
}) {
  const phone = useSyncExternalStore(subscribePhone, isPhoneNow, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const [query, setQuery] = useState("");
  const [cluster, setCluster] = useState("all");
  // Placed on the first render so the search can take focus right away.
  const [placement, setPlacement] = useState<Placement | null>(() => (phone || !triggerRef.current ? null : placeUnder(triggerRef.current)));

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () => DECA_EVENTS.filter((event) => (cluster === "all" || event.clusterId === cluster) && matches(event, needle)),
    [cluster, needle]
  );
  const groups = useMemo(
    () =>
      DECA_CLUSTERS.map((group) => ({ ...group, events: visible.filter((event) => event.clusterId === group.id) })).filter(
        (group) => group.events.length > 0
      ),
    [visible]
  );
  const [active, setActive] = useState(() => visible.findIndex((event) => event.id === value));
  const activeEvent = visible[active] ?? null;
  const optionId = (eventId: string) => `${baseId}-option-${eventId}`;

  // Desktop: follow the trigger while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (phone) return;
    const place = (event?: Event) => {
      // Scrolling the list itself doesn't move the trigger.
      if (event?.target instanceof Node && panelRef.current?.contains(event.target)) return;
      if (triggerRef.current) setPlacement(placeUnder(triggerRef.current));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [phone, triggerRef]);

  // On open: focus the search and bring the selected event into view.
  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
    if (value) document.getElementById(optionId(value))?.scrollIntoView({ block: "center" });
    // Only when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A click anywhere else closes it.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose, triggerRef]);

  const moveTo = (index: number) => {
    setActive(index);
    const event = visible[index];
    if (event) document.getElementById(optionId(event.id))?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    // Escape and Tab are handled here only, so a surrounding dialog (which
    // listens on the document too) doesn't also close or move focus.
    if (event.key === "Escape" || event.key === "Tab") {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (visible.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      moveTo(active < 0 ? (step === 1 ? 0 : visible.length - 1) : (active + step + visible.length) % visible.length);
      searchRef.current?.focus();
    } else if (event.key === "Enter" && event.target === searchRef.current) {
      event.preventDefault();
      if (activeEvent) onPick(activeEvent.id);
    } else if (event.key === "Tab") {
      // Keep Tab inside the panel.
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("input, button") ?? [])];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey && event.target !== searchRef.current) {
      // Typing anywhere in the panel goes to the search.
      searchRef.current?.focus();
    }
  };

  const listId = `${baseId}-list`;
  const motion = closing ? "animate-picker-out" : "animate-picker-in";

  const body = (
    <>
      {phone ? <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-rule-strong" /> : null}

      <div className="shrink-0 space-y-2.5 border-b-[1.5px] border-rule p-3">
        <label className="relative block">
          <span className="sr-only">Search events</span>
          <MagnifyingGlassIcon size={16} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            ref={searchRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeEvent ? optionId(activeEvent.id) : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(-1);
              listRef.current?.scrollTo({ top: 0 });
            }}
            placeholder="Search events or codes"
            autoComplete="off"
            spellCheck={false}
            className="field pl-10"
          />
        </label>
        <div role="group" aria-label="Filter by cluster" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
          {[{ id: "all", short: "All" }, ...DECA_CLUSTERS].map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={cluster === chip.id}
              onClick={() => {
                setCluster(chip.id);
                setActive(-1);
                listRef.current?.scrollTo({ top: 0 });
              }}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3 text-[13px] font-bold transition-colors pointer-coarse:min-h-11 ${
                cluster === chip.id ? "border-brand bg-brand-tint text-brand-text" : "border-rule text-fg-muted hover:border-rule-strong hover:text-fg"
              }`}
            >
              {chip.id === "all" ? null : <ClusterDot clusterId={chip.id} />}
              {chip.short}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div id={listId} role="listbox" aria-label="Events">
          {groups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`${baseId}-group-${group.id}`}>
              <div
                id={`${baseId}-group-${group.id}`}
                className="sticky top-0 z-[1] flex items-center gap-2 bg-page px-3 pb-1 pt-2.5 text-label font-bold text-fg-muted"
              >
                <ClusterDot clusterId={group.id} />
                <span className="truncate text-fg">{group.label}</span>
                <span className="ml-auto shrink-0 font-semibold">
                  {group.events.length} {group.events.length === 1 ? "event" : "events"}
                </span>
              </div>
              {group.events.map((event) => {
                const index = visible.indexOf(event);
                const isSelected = event.id === value;
                return (
                  <div
                    key={event.id}
                    id={optionId(event.id)}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={event.name}
                    title={event.name}
                    onPointerMove={() => index !== active && setActive(index)}
                    onClick={() => onPick(event.id)}
                    className={`mx-1.5 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-control px-2 text-[15px] font-semibold ${
                      isSelected ? "bg-brand-tint text-fg" : "text-fg"
                    } ${index === active ? "outline-2 -outline-offset-2 outline-[var(--focus)]" : ""}`}
                  >
                    <CodeBadge event={event} className="w-14" />
                    <span className="min-w-0 flex-1 truncate">{event.shortName}</span>
                    <span className="tag min-h-0 shrink-0 px-2 py-0.5 text-[12px]">{event.type}</span>
                    <span className="grid w-4 shrink-0 place-items-center text-brand-text">
                      {isSelected ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center text-small font-semibold text-fg-muted">No events match &lsquo;{query.trim()}&rsquo;</p>
        ) : null}
        <p className="px-4 pb-3 pt-2 text-label font-semibold text-fg-muted">
          Project, business plan, research and online events have no written exam, so they aren&apos;t listed here.
        </p>
      </div>

      <div className="flex shrink-0 items-center border-t-[1.5px] border-rule px-1.5 py-1">
        <button
          type="button"
          onClick={() => onPick("")}
          className="min-h-11 rounded-control px-2.5 text-small font-bold text-brand-text hover:underline"
        >
          Practice without an event
        </button>
      </div>
    </>
  );

  if (phone) {
    return createPortal(
      <div className="ds fixed inset-0 z-[60]" onKeyDown={onKeyDown}>
        <div aria-hidden="true" className={`absolute inset-0 bg-black/55 ${closing ? "animate-picker-out" : "animate-scrim-in"}`} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Pick your event"
          className={`${motion} absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-card border-[1.5px] border-b-0 border-rule bg-page pb-[env(safe-area-inset-bottom)]`}
        >
          {body}
        </div>
      </div>,
      document.body
    );
  }

  if (!placement) return null;
  const { maxHeight, ...position } = placement;
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Pick your event"
      onKeyDown={onKeyDown}
      style={{ ...position, maxHeight }}
      className={`ds ${motion} fixed z-[60] flex flex-col overflow-hidden rounded-card border-[1.5px] border-rule bg-page shadow-[0_6px_0_var(--rule)]`}
    >
      {body}
    </div>,
    document.body
  );
}

// Time ranges for the dashboard, computed in the viewer's own timezone (sent by
// the browser as a cookie). Weeks start on Monday; "month" is the calendar month.

export const TIME_RANGES = ["all", "month", "week", "today"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all: "All time",
  month: "This month",
  week: "This week",
  today: "Today"
};

export const TIMEZONE_COOKIE = "prepplay_tz";

export function normalizeTimeRange(value: string | undefined): TimeRange {
  return TIME_RANGES.includes(value as TimeRange) ? (value as TimeRange) : "all";
}

export function normalizeTimezone(value: string | undefined) {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

// The calendar date (year, month, day, weekday) at `instant` in `timeZone`.
function localDate(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));

  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), weekday };
}

// Offset of `timeZone` from UTC at `instant`, in milliseconds.
function offsetAt(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));

  return asUtc - Math.floor(instant / 1000) * 1000;
}

// The UTC instant of local midnight on the given calendar date. Date.UTC
// normalizes out-of-range days, so day arithmetic (day + 1, day - 6) just works.
function localMidnight(year: number, month: number, day: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetAt(guess, timeZone);
  // Re-check once in case the offset changes between the guess and the answer (DST).
  return new Date(guess - offsetAt(first, timeZone));
}

export type DateBounds = { from: string | null; to: string | null };

export function rangeBounds(range: TimeRange, timeZone: string, now = new Date()): DateBounds {
  if (range === "all") {
    return { from: null, to: null };
  }

  const { year, month, day, weekday } = localDate(now, timeZone);

  if (range === "today") {
    return {
      from: localMidnight(year, month, day, timeZone).toISOString(),
      to: localMidnight(year, month, day + 1, timeZone).toISOString()
    };
  }

  if (range === "week") {
    const monday = day - weekday;
    return {
      from: localMidnight(year, month, monday, timeZone).toISOString(),
      to: localMidnight(year, month, monday + 7, timeZone).toISOString()
    };
  }

  return {
    from: localMidnight(year, month, 1, timeZone).toISOString(),
    to: localMidnight(year, month + 1, 1, timeZone).toISOString()
  };
}

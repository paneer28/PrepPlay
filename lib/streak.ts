// Streak maths in the viewer's local timezone (runs in the browser).

// YYYY-MM-DD for the local calendar day of `date`.
export function localDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function activeDays(timestamps: string[]) {
  return new Set(timestamps.map((value) => localDayKey(new Date(value))));
}

// Consecutive days with activity, ending today — or yesterday, so a streak
// isn't lost before the viewer has had a chance to practise today.
export function streakLength(days: Set<string>, now = new Date()) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(localDayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Monday-to-Sunday of the current week.
export function currentWeek(days: Set<string>, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return WEEKDAY_LABELS.map((label, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const key = localDayKey(day);
    return { label, date: key, active: days.has(key), today: key === localDayKey(today) };
  });
}

const DAY_MS = 86_400_000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Monday-Sunday week, matching the Reports dashboard. */
export function getWeekRange(reference = new Date(), weekOffset = 0) {
  const base = startOfDay(reference);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const from = new Date(base.getTime() + (mondayOffset + weekOffset * 7) * DAY_MS);
  const to = endOfDay(new Date(from.getTime() + 6 * DAY_MS));
  return { from, to };
}

export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(from);
  const last = startOfDay(to);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatDayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

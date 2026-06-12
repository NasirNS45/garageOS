/** YYYY-MM-DD for today in local time */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a YYYY-MM-DD string by delta days using local time (no UTC conversion). */
export function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

export function fmtDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** ISO week range (Mon-Sun) for the week `offset` steps from current. */
export function weekRange(offset: number): [string, string] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((dow + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return [fmtDate(monday), fmtDate(sunday)];
}

/** Month range (1st to last day) for `offset` months from current. */
export function monthRange(offset: number): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return [fmtDate(first), fmtDate(last)];
}

/** Calendar day (YYYY-MM-DD) of a timestamp in the given IANA time zone. */
export function dayKey(ts: number, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ts));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
}

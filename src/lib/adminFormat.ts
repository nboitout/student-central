// Shared formatting helpers for the admin dashboard.
// - Timestamps are rendered in French local time (Europe/Paris — CET/CEST),
//   matching where the site is operated from.
// - Durations are shown in seconds, switching to minutes once they exceed 2 min.

const PARIS_TZ = 'Europe/Paris'

/**
 * Format an instant in French local time (CET/CEST).
 * Accepts an ISO string, epoch ms, or Date. Returns DD/MM/YYYY HH:mm (24h).
 */
export function fmtParis(
  input: string | number | Date,
  opts?: { dateOnly?: boolean; withSeconds?: boolean }
): string {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return '—'
  const o: Intl.DateTimeFormatOptions = {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  if (!opts?.dateOnly) {
    o.hour = '2-digit'
    o.minute = '2-digit'
    o.hour12 = false
    if (opts?.withSeconds) o.second = '2-digit'
  }
  return new Intl.DateTimeFormat('fr-FR', o).format(d)
}

/** Calendar date (YYYY-MM-DD) of an instant in Europe/Paris. */
export function parisDate(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ''
  // en-CA renders as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Hour of day (0–23) of an instant in Europe/Paris. */
export function parisHour(input: string | number | Date): number {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return NaN
  return parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone: PARIS_TZ, hour: '2-digit', hour12: false }).format(d),
    10
  ) % 24
}

/**
 * Format a duration given in seconds. Stays in seconds up to 2 minutes, then
 * switches to minutes (e.g. 95 → "95s", 150 → "2m 30s", 180 → "3m").
 */
export function fmtDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 120) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s === 0 ? `${m}m` : `${m}m ${String(s).padStart(2, '0')}s`
}

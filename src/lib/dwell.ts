// De-fragment dwell data.
//
// Since the mobile visibilitychange fix, a single page view can emit several
// `page_leave` rows (one per background/flush). For *totals* and *sums* that's
// fine, but for *averages* it deflates the result (many small fragments instead
// of one visit). This collapses fragments back into one dwell value per visit.
//
// A visit = readerId + sessionId + page; fragments share all three and are
// summed. Rows with no sessionId are SPA-navigation leaves (one per page view,
// never fragmented), so each is kept as its own visit.

export interface LeaveLike {
  readerId: string
  sessionId: string
  page: string
  duration_seconds: string
}

/** One dwell value (seconds) per visit, with fragments summed together. */
export function perVisitSeconds(rows: LeaveLike[]): number[] {
  const byKey = new Map<string, number>()
  const anon: number[] = []
  for (const r of rows) {
    const n = parseFloat(r.duration_seconds)
    if (isNaN(n) || n <= 0) continue
    if (r.sessionId) {
      const k = `${r.readerId}|${r.sessionId}|${r.page}`
      byKey.set(k, (byKey.get(k) ?? 0) + n)
    } else {
      anon.push(n)
    }
  }
  return [...byKey.values(), ...anon]
}

const SESSION_ID_KEY = 'sc_sid'
const UTM_KEY = 'sc_utm'
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

// Reads UTM params from the current URL on first call per session,
// then returns the stored value — so UTM attribution sticks even after
// the visitor navigates to another page within the same session.
export function getSessionUtm(): Record<string, string> {
  const stored = sessionStorage.getItem(UTM_KEY)
  if (stored !== null) {
    try { return JSON.parse(stored) } catch { /* */ }
  }
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of UTM_PARAMS) {
    const val = params.get(key)
    if (val) utm[key] = val
  }
  sessionStorage.setItem(UTM_KEY, JSON.stringify(utm))
  return utm
}

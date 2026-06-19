import { fetchAllSheets } from '@/lib/sheets'
import { fmtParis, parisDate, fmtDuration } from '@/lib/adminFormat'

export const dynamic = 'force-dynamic'

// Turn an ISO 3166 country code (FR, KR, …) into a full name (France, South Korea).
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryLabel(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code || 'Unknown'
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

// Coarse device class from a user-agent string (laptop vs desktop is
// indistinguishable from UA, so both report as "Desktop").
function deviceType(ua: string): string {
  if (!ua) return '—'
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Nexus 7|Nexus 10|(?:Android(?!.*Mobile))/i.test(ua)) return 'Tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

// Same crawler signature used by the server-side bot filter in lib/sheets.ts.
const BOT_UA = /bot|crawl|spider|slurp|mediapartners|bingpreview|google-read-aloud|read-aloud|google web preview|apis-google|feedfetcher|facebookexternal|embedly|quora link preview|pinterest|vkshare|whatsapp|telegram|headless|phantomjs|python-requests|curl|wget|httpclient|go-http-client|java\/|okhttp|axios|node-fetch|libwww|scrapy/i
const DESKTOP_LINUX = /X11; Linux x86_64/

// Bot-likelihood signals for a single visitor. A logged-in user is always a
// real human, so we never flag them.
const MIN_DWELL_SECONDS = 4
function botSignals(ua: string, dwellSeconds: number, isUser: boolean): { verdict: string; flags: string[] } {
  if (isUser) return { verdict: 'Logged-in user', flags: [] }
  const flags: string[] = []
  if (!ua) flags.push('no user-agent')
  if (BOT_UA.test(ua)) flags.push('crawler UA')
  if (dwellSeconds < MIN_DWELL_SECONDS) flags.push(`under ${MIN_DWELL_SECONDS}s dwell`)
  if (DESKTOP_LINUX.test(ua) && dwellSeconds === 0) flags.push('desktop-Linux, no dwell')
  let verdict = 'Likely human'
  if (flags.some((f) => f === 'crawler UA' || f === 'no user-agent')) verdict = 'Likely bot'
  else if (dwellSeconds < MIN_DWELL_SECONDS) verdict = 'Likely bot'
  return { verdict, flags }
}

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>
}) {
  const { country } = await searchParams
  const { visits } = await fetchAllSheets()

  // Per-reader dwell: total active seconds + whether any page_leave was recorded.
  const dwell = new Map<string, { total: number; count: number }>()
  visits
    .filter((v) => v.event === 'page_leave' && v.readerId)
    .forEach((v) => {
      const n = parseFloat(v.duration_seconds)
      const d = dwell.get(v.readerId) ?? { total: 0, count: 0 }
      d.count += 1
      if (!isNaN(n) && n > 0) d.total += n
      dwell.set(v.readerId, d)
    })

  // A reader is "identified" if any of their visits carried an email.
  const emailByReader = new Map<string, string>()
  visits.forEach((v) => {
    if (v.readerId && v.userEmail && !emailByReader.has(v.readerId)) {
      emailByReader.set(v.readerId, v.userEmail)
    }
  })

  let pageVisits = visits.filter((v) => v.event === 'page_visit')

  // Earliest day each reader was ever seen — for a genuine cross-day return.
  const firstSeen = new Map<string, string>()
  pageVisits.forEach((v) => {
    if (!v.readerId) return
    const day = parisDate(v.timestamp)
    const cur = firstSeen.get(v.readerId)
    if (!cur || day < cur) firstSeen.set(v.readerId, day)
  })

  // Optional country filter (?country=KR or ?country=South Korea).
  const filter = (country ?? '').trim().toLowerCase()
  if (filter) {
    pageVisits = pageVisits.filter((v) => {
      const code = (v.country || '').toLowerCase()
      return code === filter || countryLabel(v.country).toLowerCase() === filter
    })
  }

  const rows = [...pageVisits]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 250)

  // Country tallies for the quick-filter chips.
  const byCountry = new Map<string, number>()
  visits
    .filter((v) => v.event === 'page_visit')
    .forEach((v) => {
      const c = countryLabel(v.country)
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1)
    })
  const countryChips = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)

  const fmtTs = (t: string) => fmtParis(t)

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Visits inspector</h1>
          <p className="adm-page-sub">
            Raw <code>page_visit</code> rows (newest first, max 250) for the traffic that passed the
            quality filter — the operator, self-declared crawlers, and anyone who stayed under 4 seconds
            of active time (and was never logged in) are already removed upstream.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <a
          href="/admin/visits"
          className="adm-nav-link"
          style={{ border: '1px solid var(--adm-i08)', padding: '4px 10px', borderRadius: 3, fontSize: '.8rem' }}
        >
          All countries
        </a>
        {countryChips.map(([c, n]) => (
          <a
            key={c}
            href={`/admin/visits?country=${encodeURIComponent(c)}`}
            className="adm-nav-link"
            style={{ border: '1px solid var(--adm-i08)', padding: '4px 10px', borderRadius: 3, fontSize: '.8rem' }}
          >
            {c} ({n})
          </a>
        ))}
      </div>

      {filter && (
        <p className="adm-section-title">
          Filtered: {country} — {rows.length} visit{rows.length === 1 ? '' : 's'}
        </p>
      )}

      <div className="adm-leads-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Time (Paris)</th>
              <th>User</th>
              <th>Country</th>
              <th>Device</th>
              <th>Dwell</th>
              <th>Ret.</th>
              <th>Page</th>
              <th>Referer</th>
              <th>UTM</th>
              <th>Verdict</th>
              <th>User-agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v, i) => {
              const d = dwell.get(v.readerId)
              const hasDwell = !!d && d.count > 0
              const email = v.userEmail || emailByReader.get(v.readerId) || ''
              const { verdict, flags } = botSignals(v.userAgent, d?.total ?? 0, !!email)
              const page = v.page.replace(/^https?:\/\/[^/]+/, '') || '/'
              const ref = (v.referer || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
              const day = parisDate(v.timestamp)
              const isReturn = (firstSeen.get(v.readerId) ?? day) < day
              const verdictColor =
                verdict === 'Likely bot' ? 'rgba(200,80,60,.95)' : verdict === 'Logged-in user' ? 'rgba(74,107,90,.95)' : 'rgba(74,107,90,.75)'
              return (
                <tr key={i}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtTs(v.timestamp)}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || <span className="muted">anonymous</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{countryLabel(v.country)}</td>
                  <td>{deviceType(v.userAgent)}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {hasDwell ? fmtDuration(d!.total) : '—'}
                  </td>
                  <td>{isReturn ? 'yes' : '—'}</td>
                  <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page}</td>
                  <td className="muted" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref || '—'}</td>
                  <td className="muted">{v.utm_source || '—'}</td>
                  <td style={{ color: verdictColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {verdict}
                    {flags.length > 0 && (
                      <span className="muted" style={{ display: 'block', fontWeight: 400, fontSize: '.72rem' }}>
                        {flags.join(', ')}
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: 320, fontSize: '.72rem', lineHeight: 1.4, color: 'rgba(245,240,232,.7)' }}>
                    {v.userAgent || '—'}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="muted">No matching visits</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

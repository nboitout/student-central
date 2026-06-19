import { fetchAllSheets } from '@/lib/sheets'
import Scorecard from '@/components/admin/Scorecard'
import AdminBarChart, { BarDataPoint } from '@/components/admin/AdminBarChart'
import { fmtParis, parisDate } from '@/lib/adminFormat'

export const dynamic = 'force-dynamic'

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryLabel(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code || 'Unknown'
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

function deviceType(ua: string): string {
  if (!ua) return '—'
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Nexus 7|Nexus 10|(?:Android(?!.*Mobile))/i.test(ua)) return 'Tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

interface UserStat {
  email: string
  first: number
  last: number
  sessions: Set<string>
  pages: Set<string>
  visits: number
  lastUA: string
  lang: string
  country: string
}

export default async function UsersPage() {
  const { visits } = await fetchAllSheets()

  // Aggregate every visit that carries an email into per-user stats.
  const stats = new Map<string, UserStat>()
  visits
    .filter((v) => v.userEmail)
    .forEach((v) => {
      const key = v.userEmail.toLowerCase()
      const t = new Date(v.timestamp).getTime()
      if (isNaN(t)) return
      let s = stats.get(key)
      if (!s) {
        s = {
          email: v.userEmail,
          first: t,
          last: t,
          sessions: new Set(),
          pages: new Set(),
          visits: 0,
          lastUA: v.userAgent || '',
          lang: v.lang || '',
          country: v.country || '',
        }
        stats.set(key, s)
      }
      if (t < s.first) s.first = t
      if (t >= s.last) {
        s.last = t
        if (v.userAgent) s.lastUA = v.userAgent
      }
      if (v.sessionId) s.sessions.add(v.sessionId)
      if (v.event === 'page_visit') {
        s.visits += 1
        const page = (v.page.replace(/^https?:\/\/[^/]+/, '').split('?')[0]) || '/'
        s.pages.add(page)
      }
      if (!s.lang && v.lang) s.lang = v.lang
      if (!s.country && v.country) s.country = v.country
    })

  const users = [...stats.values()].sort((a, b) => b.last - a.last)

  const total = users.length
  const cutoff7 = daysAgo(7)
  const cutoff30 = daysAgo(30)
  const new7 = users.filter((u) => parisDate(u.first) >= cutoff7).length
  const new30 = users.filter((u) => parisDate(u.first) >= cutoff30).length

  // Bar: users by language
  const langCount = new Map<string, number>()
  users.forEach((u) => {
    const lg = u.lang || 'Unknown'
    langCount.set(lg, (langCount.get(lg) ?? 0) + 1)
  })
  const langData: BarDataPoint[] = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Table: by country
  const countryCount = new Map<string, number>()
  users.forEach((u) => {
    const c = countryLabel(u.country || 'Unknown')
    countryCount.set(c, (countryCount.get(c) ?? 0) + 1)
  })
  const countryRows = [...countryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count }))

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Users</h1>
          <p className="adm-page-sub">Everyone who has signed in (identified by email)</p>
        </div>
      </div>

      <div className="adm-scorecards">
        <Scorecard label="Total Users" value={total.toLocaleString()} />
        <Scorecard label="New Users — last 7 Days" value={new7.toLocaleString()} />
        <Scorecard label="New Users — last 30 Days" value={new30.toLocaleString()} />
      </div>

      <div className="adm-chart-card" style={{ marginBottom: 24 }}>
        <p className="adm-chart-title">Users by Language</p>
        <AdminBarChart data={langData} color="#c9a35e" showValues />
      </div>

      <p className="adm-section-title">By Country</p>
      <div className="adm-table-wrap" style={{ marginBottom: 32 }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Users</th>
            </tr>
          </thead>
          <tbody>
            {countryRows.map((row) => (
              <tr key={row.country}>
                <td>{row.country}</td>
                <td>{row.count}</td>
              </tr>
            ))}
            {countryRows.length === 0 && (
              <tr>
                <td colSpan={2} className="muted">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="adm-section-title">All Users</p>
      <div className="adm-leads-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Lang</th>
              <th>Country</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Sessions</th>
              <th>Page Views</th>
              <th>Pages</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td>{u.email}</td>
                <td>{u.lang || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{u.country ? countryLabel(u.country) : '—'}</td>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtParis(u.first)}</td>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtParis(u.last)}</td>
                <td>{u.sessions.size || '—'}</td>
                <td>{u.visits}</td>
                <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[...u.pages].join(', ') || '—'}
                </td>
                <td>{deviceType(u.lastUA)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="muted">No signed-in users yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

import { fetchAllSheets } from '@/lib/sheets'
import Scorecard from '@/components/admin/Scorecard'
import AdminStackedCountryChart, { StackedTimePoint } from '@/components/admin/AdminStackedCountryChart'
import AdminPieChart, { PieDataPoint } from '@/components/admin/AdminPieChart'
import DaySelect from '@/components/admin/DaySelect'
import { fmtParis, parisDate, parisHour, fmtDuration } from '@/lib/adminFormat'
import { perVisitSeconds, type LeaveLike } from '@/lib/dwell'

export const dynamic = 'force-dynamic'

// Adjust to the date analytics tracking went live for studentcentral.ai.
const START_DATE = '2026-07-01'

function formatPct(n: number) {
  return `${n.toFixed(1)}%`
}

function formatDuration(secs: number) {
  return fmtDuration(secs)
}

function avgDuration(rows: LeaveLike[]): number {
  const visits = perVisitSeconds(rows)
  if (visits.length === 0) return 0
  return visits.reduce((a, b) => a + b, 0) / visits.length
}

// Turn an ISO 3166 country code (FR, US, …) into a full name (France, United States).
// Falls back to the raw value for non-codes like 'Unknown' / 'Other'.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryLabel(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: { day?: string }
}) {
  const { day } = searchParams
  let leads, visits, errors
  try {
    ;({ leads, visits, errors } = await fetchAllSheets())
  } catch (err) {
    return (
      <div style={{ padding: 40, color: 'var(--adm-ink)', fontFamily: 'DM Sans, sans-serif' }}>
        <p className="adm-section-title">Dashboard error</p>
        <pre style={{ color: 'rgba(200,60,40,.9)', fontSize: 13, marginTop: 12 }}>{String(err)}</pre>
        <p style={{ color: 'var(--adm-i50)', marginTop: 12, fontSize: '.82rem', lineHeight: 1.6 }}>Check that GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set correctly in Vercel.</p>
      </div>
    )
  }

  const errorEntries = Object.entries(errors ?? {})

  // --- Filter all data from launch date onwards (Paris calendar dates) ---
  const filteredLeads = leads.filter((l) => parisDate(l.timestamp) >= START_DATE)
  const filteredVisits = visits.filter((v) => parisDate(v.timestamp) >= START_DATE)

  // --- Unique visitors (distinct readerId in page_visit events) ---
  const pageVisits = filteredVisits.filter((v) => v.event === 'page_visit')
  const uniqueVisitorSet = new Set(pageVisits.map((v) => v.readerId).filter(Boolean))
  const uniqueVisitors = uniqueVisitorSet.size

  // --- Total readers (distinct emails — populated once sign-ins are logged as Leads) ---
  const totalLeads = new Set(filteredLeads.map((l) => l.email.toLowerCase()).filter(Boolean)).size

  // --- Conversion rate ---
  const convRate = uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0

  // --- Return visitor rate: % of distinct visitors seen on more than one distinct date ---
  const visitorDates = new Map<string, Set<string>>()
  pageVisits.forEach((v) => {
    if (!v.readerId) return
    if (!visitorDates.has(v.readerId)) visitorDates.set(v.readerId, new Set())
    visitorDates.get(v.readerId)!.add(v.timestamp.slice(0, 10))
  })
  const totalVisitors = visitorDates.size
  const returningVisitors = [...visitorDates.values()].filter((dates) => dates.size > 1).length
  const returnRate = totalVisitors > 0 ? (returningVisitors / totalVisitors) * 100 : 0

  // --- Avg homepage dwell time ---
  const avgHome = avgDuration(
    filteredVisits.filter((v) => {
      if (v.event !== 'page_leave') return false
      const p = v.page.replace(/^https?:\/\/[^/]+/, '')
      return p === '/' || p === ''
    })
  )

  // --- Stacked bar: unique visitors per day, stacked by country (top 10 + Other) ---
  // Count distinct reader_ids per bucket (not raw page_visit events), so reloads
  // and returns within a bucket don't inflate the numbers.
  const countryVisitors = new Map<string, Set<string>>()
  pageVisits.forEach((v) => {
    const c = countryLabel(v.country || 'Unknown')
    if (!countryVisitors.has(c)) countryVisitors.set(c, new Set())
    if (v.readerId) countryVisitors.get(c)!.add(v.readerId)
  })
  const topCountries = [...countryVisitors.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .map(([c]) => c)
  const topCountrySet = new Set(topCountries)
  const stackedCountries = [...topCountries, 'Other']

  // distinct reader_ids per (date, country bucket)
  const perDate = new Map<string, Map<string, Set<string>>>()
  pageVisits.forEach((v) => {
    const date = parisDate(v.timestamp)
    const c = countryLabel(v.country || 'Unknown')
    const key = topCountrySet.has(c) ? c : 'Other'
    if (!perDate.has(date)) perDate.set(date, new Map())
    const m = perDate.get(date)!
    if (!m.has(key)) m.set(key, new Set())
    if (v.readerId) m.get(key)!.add(v.readerId)
  })

  // Axis: one entry per Paris calendar date from launch to today.
  const todayParis = parisDate(new Date())
  const startD = new Date(START_DATE + 'T12:00:00Z')
  const stackedData: StackedTimePoint[] = []
  for (let d = new Date(startD); d.toISOString().slice(0, 10) <= todayParis; d.setUTCDate(d.getUTCDate() + 1)) {
    const entry: StackedTimePoint = { date: d.toISOString().slice(0, 10) }
    stackedCountries.forEach((c) => { entry[c] = 0 })
    stackedData.push(entry)
  }
  const dateMap = new Map(stackedData.map((d) => [d.date as string, d]))
  for (const [date, m] of perDate) {
    const entry = dateMap.get(date)
    if (!entry) continue
    for (const [key, set] of m) entry[key] = set.size
  }

  // --- Pie chart: visitors by language ---
  const langCount = new Map<string, number>()
  pageVisits.forEach((v) => {
    const l = v.lang || 'Unknown'
    langCount.set(l, (langCount.get(l) ?? 0) + 1)
  })
  const langData: PieDataPoint[] = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // --- All-time unique visitors by country (every date; exclusions + bot filter
  // already applied in fetchAllSheets). Distinct reader_ids per country. ---
  const allTimeCountry = new Map<string, Set<string>>()
  visits
    .filter((v) => v.event === 'page_visit')
    .forEach((v) => {
      const c = countryLabel(v.country || 'Unknown')
      if (!allTimeCountry.has(c)) allTimeCountry.set(c, new Set())
      if (v.readerId) allTimeCountry.get(c)!.add(v.readerId)
    })
  const countryRows = [...allTimeCountry.entries()]
    .map(([country, set]) => ({ country, count: set.size }))
    .sort((a, b) => b.count - a.count)
  const allTimeVisitsTotal = countryRows.reduce((sum, r) => sum + r.count, 0)

  // --- Intraday: visits per hour for a selected day (Paris time), by country ---
  const todayParisDay = parisDate(new Date())
  const selectedDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : todayParisDay
  // Days offered in the picker: today + every day that has visit data, newest first
  const dayOptions = [...new Set([todayParisDay, ...pageVisits.map((v) => parisDate(v.timestamp))])]
    .sort((a, b) => (a < b ? 1 : -1))
  const dayVisits = pageVisits.filter((v) => parisDate(v.timestamp) === selectedDay)
  const dayVisitorCount = new Set(dayVisits.map((v) => v.readerId).filter(Boolean)).size
  // rank that day's countries by distinct visitors
  const dayCountryVisitors = new Map<string, Set<string>>()
  dayVisits.forEach((v) => {
    const c = countryLabel(v.country || 'Unknown')
    if (!dayCountryVisitors.has(c)) dayCountryVisitors.set(c, new Set())
    if (v.readerId) dayCountryVisitors.get(c)!.add(v.readerId)
  })
  const dayTopCountries = [...dayCountryVisitors.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .map(([c]) => c)
  const dayTopSet = new Set(dayTopCountries)
  const intradayCountries = [...dayTopCountries, 'Other']
  // distinct reader_ids per (hour, country bucket) — hour in Paris time
  const hourSets: Map<string, Set<string>>[] = Array.from({ length: 24 }, () => new Map())
  dayVisits.forEach((v) => {
    const hour = parisHour(v.timestamp)
    if (isNaN(hour) || hour < 0 || hour > 23) return
    const c = countryLabel(v.country || 'Unknown')
    const key = dayTopSet.has(c) ? c : 'Other'
    const m = hourSets[hour]
    if (!m.has(key)) m.set(key, new Set())
    if (v.readerId) m.get(key)!.add(v.readerId)
  })
  const intradayData: StackedTimePoint[] = []
  for (let h = 0; h < 24; h++) {
    const entry: StackedTimePoint = { date: `${String(h).padStart(2, '0')}:00` }
    intradayCountries.forEach((c) => { entry[c] = hourSets[h].get(c)?.size ?? 0 })
    intradayData.push(entry)
  }

  // Shared country → colour map so a country keeps the same colour across both
  // the daily and the intraday stacked charts. France is pinned to red; Other
  // to neutral grey; the rest get distinct palette hues in a stable (alphabetical)
  // order so colours don't shuffle as the data changes.
  const COUNTRY_PALETTE = ['#3cb44b', '#4363d8', '#f58231', '#911eb4', '#469990', '#f032e6', '#9a6324', '#800000', '#808000']
  const countryColors: Record<string, string> = { France: '#e6194b', Other: '#9a9a9a' }
  ;[...new Set([...stackedCountries, ...intradayCountries])]
    .filter((c) => c !== 'France' && c !== 'Other')
    .sort()
    .forEach((c, i) => {
      countryColors[c] = COUNTRY_PALETTE[i % COUNTRY_PALETTE.length]
    })

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Overview</h1>
          <p className="adm-page-sub">Updated {fmtParis(new Date(), { withSeconds: true })} (Paris)</p>
        </div>
      </div>

      {errorEntries.length > 0 && (
        <div style={{ background: 'rgba(255,100,100,.08)', border: '1px solid rgba(255,120,120,.24)', borderLeft: '3px solid rgba(255,120,120,.6)', borderRadius: 3, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ color: 'var(--adm-ink)', fontWeight: 600, marginBottom: 6, fontSize: '.8rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Sheet loading errors</p>
          {errorEntries.map(([sheet, msg]) => (
            <pre key={sheet} style={{ color: 'rgba(200,60,40,.9)', fontSize: 12, margin: '4px 0' }}>{sheet}: {msg}</pre>
          ))}
        </div>
      )}

      <div className="adm-scorecards">
        <Scorecard label="Unique Visitors" value={uniqueVisitors.toLocaleString()} />
        <Scorecard label="Total Readers" value={totalLeads.toLocaleString()} subtitle="signed-up users (once logged)" />
        <Scorecard label="Conversion Rate" value={formatPct(convRate)} subtitle="became a registered user" />
        <Scorecard label="Return Visitor Rate" value={formatPct(returnRate)} subtitle="came back on a later day" />
        <Scorecard
          label="Avg Time — Homepage"
          value={formatDuration(avgHome)}
          subtitle="page_leave events"
        />
      </div>

      <p className="adm-section-title">Visitors — Since {START_DATE}</p>
      <div className="adm-chart-card" style={{ marginBottom: 24 }}>
        <p className="adm-chart-title">Daily unique visitors by country (top 10)</p>
        <AdminStackedCountryChart data={stackedData} countries={stackedCountries} colorMap={countryColors} />
      </div>

      <div className="adm-chart-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <p className="adm-chart-title" style={{ marginBottom: 0 }}>
            By hour ({selectedDay}{selectedDay === todayParisDay ? ', today' : ''}, Paris time) — {dayVisitorCount.toLocaleString()} visitors
          </p>
          <DaySelect days={dayOptions} selected={selectedDay} today={todayParisDay} />
        </div>
        <AdminStackedCountryChart
          data={intradayData}
          countries={intradayCountries}
          labelMode="raw"
          interval={2}
          colorMap={countryColors}
        />
      </div>

      <div className="adm-charts-grid">
        <div className="adm-chart-card">
          <p className="adm-chart-title">All-time unique visitors by country</p>
          <p className="adm-page-sub" style={{ marginTop: -12, marginBottom: 16 }}>
            All dates · {allTimeVisitsTotal.toLocaleString()} visitors · excludes admins &amp; bots
          </p>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Visitors</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.map((row) => (
                  <tr key={row.country}>
                    <td>{row.country}</td>
                    <td>{row.count.toLocaleString()}</td>
                    <td className="muted">
                      {allTimeVisitsTotal > 0 ? formatPct((row.count / allTimeVisitsTotal) * 100) : '—'}
                    </td>
                  </tr>
                ))}
                {countryRows.length > 0 && (
                  <tr>
                    <td style={{ fontWeight: 600, borderTop: '1px solid var(--adm-i08)' }}>Total</td>
                    <td style={{ fontWeight: 600, borderTop: '1px solid var(--adm-i08)' }}>{allTimeVisitsTotal.toLocaleString()}</td>
                    <td className="muted" style={{ borderTop: '1px solid var(--adm-i08)' }}>100%</td>
                  </tr>
                )}
                {countryRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="adm-chart-card">
          <p className="adm-chart-title">Visitors by Language</p>
          <AdminPieChart data={langData} />
        </div>
      </div>
    </main>
  )
}

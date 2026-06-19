import { fetchAllSheets } from '@/lib/sheets'
import Scorecard from '@/components/admin/Scorecard'
import AdminBarChart, { BarDataPoint } from '@/components/admin/AdminBarChart'
import { parisDate, fmtDuration } from '@/lib/adminFormat'

export const dynamic = 'force-dynamic'

function avgDuration(rows: { duration_seconds: string }[]): number {
  const valid = rows
    .map((r) => parseFloat(r.duration_seconds))
    .filter((n) => !isNaN(n) && n > 0)
  if (valid.length === 0) return 0
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// Friendly, admin-readable label for a tracked page path.
const PATH_LABELS: Record<string, string> = {
  '/': 'Homepage',
  '/login': 'Login',
  '/workspace': 'Workspace',
  '/workspace/course': 'Course',
  '/workspace/course/dashboard': 'Course dashboard',
  '/workspace/mcq': 'MCQ / Tutor',
  '/faculty': 'Faculty',
}

function pageLabel(rawPath: string): string {
  const p = (rawPath.replace(/^https?:\/\/[^/]+/, '').split('?')[0]) || '/'
  if (PATH_LABELS[p]) return PATH_LABELS[p]
  // Longest matching known prefix, so deep routes still group sensibly.
  const match = Object.keys(PATH_LABELS)
    .filter((k) => k !== '/' && p.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PATH_LABELS[match] : p
}

function pageOrder(label: string): number {
  const order = ['Homepage', 'Login', 'Workspace', 'Course', 'Course dashboard', 'MCQ / Tutor', 'Faculty']
  const i = order.indexOf(label)
  return i === -1 ? 999 : i
}

export default async function EngagementPage() {
  const { events, visits } = await fetchAllSheets()

  const pageLeaves = visits.filter((v) => v.event === 'page_leave')

  const avgHome = avgDuration(pageLeaves.filter((v) => {
    const p = v.page.replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    return p === '/' || p === ''
  }))
  const avgWorkspace = avgDuration(pageLeaves.filter((v) => v.page.includes('/workspace')))
  const avgMcq = avgDuration(pageLeaves.filter((v) => v.page.includes('/workspace/mcq')))

  // Return visitor rate: % of distinct visitors seen on more than one distinct date
  const pageVisits = visits.filter((v) => v.event === 'page_visit')
  const visitorDates = new Map<string, Set<string>>()
  pageVisits.forEach((v) => {
    if (!v.readerId) return
    if (!visitorDates.has(v.readerId)) visitorDates.set(v.readerId, new Set())
    visitorDates.get(v.readerId)!.add(parisDate(v.timestamp))
  })
  const totalVisitors = visitorDates.size
  const returningVisitors = [...visitorDates.values()].filter((dates) => dates.size > 1).length
  const returnRate = totalVisitors > 0 ? (returningVisitors / totalVisitors) * 100 : 0

  // Bar: avg dwell time per page (grouped by friendly label, in app order)
  const pageMap = new Map<string, number[]>()
  pageLeaves.forEach((v) => {
    const n = parseFloat(v.duration_seconds)
    if (isNaN(n) || n <= 0) return
    const label = pageLabel(v.page)
    const arr = pageMap.get(label)
    if (arr) arr.push(n)
    else pageMap.set(label, [n])
  })
  const dwellData: BarDataPoint[] = [...pageMap.entries()]
    .map(([name, arr]) => ({
      name,
      value: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    }))
    .sort((a, b) => pageOrder(a.name) - pageOrder(b.name))

  // Return frequency distribution: buckets 0, 1, 2, 3, 4+
  const returnBuckets: BarDataPoint[] = [
    { name: '0 returns', value: 0 },
    { name: '1 return',  value: 0 },
    { name: '2 returns', value: 0 },
    { name: '3 returns', value: 0 },
    { name: '4+',        value: 0 },
  ]
  visitorDates.forEach((dates) => {
    const returns = dates.size - 1
    if      (returns === 0) returnBuckets[0].value++
    else if (returns === 1) returnBuckets[1].value++
    else if (returns === 2) returnBuckets[2].value++
    else if (returns === 3) returnBuckets[3].value++
    else                    returnBuckets[4].value++
  })

  // Bar: tracked events by type (populated as the app emits /api/track events).
  const eventCount = new Map<string, number>()
  events.forEach((e) => {
    if (!e.event) return
    eventCount.set(e.event, (eventCount.get(e.event) ?? 0) + 1)
  })
  const eventData: BarDataPoint[] = [...eventCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Bar: UTM sources
  const utmCount = new Map<string, number>()
  visits
    .filter((v) => v.utm_source && v.utm_source.trim() !== '')
    .forEach((v) => {
      const s = v.utm_source.trim()
      utmCount.set(s, (utmCount.get(s) ?? 0) + 1)
    })
  const utmData: BarDataPoint[] = [...utmCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Engagement</h1>
          <p className="adm-page-sub">Visitor behaviour and content engagement metrics</p>
        </div>
      </div>

      <div className="adm-scorecards">
        <Scorecard label="Avg Time — Homepage" value={fmtDuration(avgHome)} subtitle="page_leave events" />
        <Scorecard label="Avg Time — Workspace" value={fmtDuration(avgWorkspace)} subtitle="page_leave events" />
        <Scorecard label="Avg Time — MCQ / Tutor" value={fmtDuration(avgMcq)} subtitle="page_leave events" />
        <Scorecard label="Return Visitor Rate" value={`${returnRate.toFixed(1)}%`} subtitle="of distinct visitors" />
      </div>

      <div className="adm-chart-card" style={{ marginBottom: 24 }}>
        <p className="adm-chart-title">Return frequency — visitors by number of return visits</p>
        <p className="adm-page-sub" style={{ marginTop: -10, marginBottom: 18, maxWidth: 720, lineHeight: 1.6 }}>
          Groups visitors by how many <strong>separate days</strong> they came back. “0 returns” = seen on
          one day only; “2 returns” = seen on 3 different dates. Same-day reloads don’t count. Identity is the
          browser’s anonymous <code>reader_id</code> cookie, so clearing cookies or switching device shows up
          as a new visitor.
        </p>
        <AdminBarChart data={returnBuckets} color="#4a6b5a" showValues />
      </div>

      <div className="adm-charts-grid">
        <div className="adm-chart-card">
          <p className="adm-chart-title">Avg Dwell Time per Page (seconds)</p>
          <p className="adm-page-sub" style={{ marginTop: -10, marginBottom: 18, lineHeight: 1.6 }}>
            Average <strong>active</strong> seconds spent on each page before leaving (time with the tab
            hidden isn’t counted).
          </p>
          <AdminBarChart data={dwellData} color="#4a6b5a" layout="vertical" showValues />
        </div>
        <div className="adm-chart-card">
          <p className="adm-chart-title">Tracked Events by Type</p>
          <p className="adm-page-sub" style={{ marginTop: -10, marginBottom: 18, lineHeight: 1.6 }}>
            Custom events forwarded via <code>/api/track</code> (e.g. button clicks). Empty until the UI
            starts emitting them.
          </p>
          <AdminBarChart data={eventData} color="#c9a35e" layout="vertical" showValues />
        </div>
      </div>

      <div className="adm-chart-card" style={{ marginBottom: 32 }}>
        <p className="adm-chart-title">UTM Sources</p>
        <p className="adm-page-sub" style={{ marginTop: -10, marginBottom: 18, maxWidth: 640, lineHeight: 1.6 }}>
          Counts only visitors who arrive through a link <strong>tagged</strong> with UTM parameters (e.g.
          <code>?utm_source=newsletter&amp;utm_medium=email</code>). Untagged links are recorded as
          direct/referral instead, so this stays empty until tagged campaigns are used.
        </p>
        <AdminBarChart data={utmData} color="#4a6b5a" showValues />
      </div>
    </main>
  )
}

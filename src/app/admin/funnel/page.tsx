import { fetchAllSheets } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

interface Step {
  label: string
  hint: string
  readers: Set<string>
}

export default async function FunnelPage() {
  const { visits } = await fetchAllSheets()
  const pageVisits = visits.filter((v) => v.event === 'page_visit' && v.readerId)

  const path = (raw: string) => (raw.replace(/^https?:\/\/[^/]+/, '').split('?')[0]) || '/'

  // Reader → email link, both directly (a visit carried an email) and via the
  // shared sessionId that bridges the pre-login and post-login rows.
  const signedInReaders = new Set<string>()
  const emailSessions = new Set<string>()
  visits.forEach((v) => {
    if (v.userEmail) {
      if (v.readerId) signedInReaders.add(v.readerId)
      if (v.sessionId) emailSessions.add(v.sessionId)
    }
  })
  visits.forEach((v) => {
    if (v.readerId && v.sessionId && emailSessions.has(v.sessionId)) signedInReaders.add(v.readerId)
  })

  const homepage = new Set<string>()
  const login = new Set<string>()
  const workspace = new Set<string>()
  pageVisits.forEach((v) => {
    const p = path(v.page)
    if (p === '/') homepage.add(v.readerId)
    if (p.startsWith('/login')) login.add(v.readerId)
    if (p.startsWith('/workspace')) workspace.add(v.readerId)
  })

  const steps: Step[] = [
    { label: 'Visited the homepage', hint: 'distinct anonymous visitors on /', readers: homepage },
    { label: 'Reached the login page', hint: 'opened /login', readers: login },
    { label: 'Signed in', hint: 'a session carried an email', readers: signedInReaders },
    { label: 'Entered the workspace', hint: 'opened /workspace', readers: workspace },
  ]

  const top = steps[0].readers.size || 1

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Conversion funnel</h1>
          <p className="adm-page-sub">
            Anonymous visitor → identified user. Each step counts distinct people (browser
            <code> reader_id</code>); the “Signed in” step links a pre-login visitor to the email they
            sign in as via the shared session id.
          </p>
        </div>
      </div>

      <div className="adm-funnel">
        {steps.map((step, i) => {
          const count = step.readers.size
          const prev = i === 0 ? count : steps[i - 1].readers.size
          const dropPct = prev > 0 ? ((prev - count) / prev) * 100 : 0
          const widthPct = (count / top) * 100
          return (
            <div className="adm-funnel-step" key={step.label}>
              <span className="adm-funnel-num">{i + 1}</span>
              <span className="adm-funnel-label">
                {step.label}
                <span className="adm-page-sub" style={{ display: 'block', marginTop: 2 }}>{step.hint}</span>
              </span>
              <span className="adm-funnel-count">{count.toLocaleString()}</span>
              <span className={`adm-funnel-drop${i === 0 ? ' first' : ''}`}>
                {i === 0 ? `${top.toLocaleString()} total` : `−${dropPct.toFixed(0)}%`}
              </span>
              <div className="adm-funnel-bar-wrap">
                <div className="adm-funnel-bar" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <p className="adm-page-sub" style={{ maxWidth: 720, lineHeight: 1.6 }}>
        Note: the steps are independent counts, not a strict subset chain — a visitor who lands directly
        on <code>/login</code> (e.g. from a bookmarked link) appears at step 2 without step 1. The
        drop-off percentages compare each step to the one above it.
      </p>
    </main>
  )
}

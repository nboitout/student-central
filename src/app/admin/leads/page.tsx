import { fetchAllSheets } from '@/lib/sheets'
import { fmtParis, parisDate } from '@/lib/adminFormat'
import Scorecard from '@/components/admin/Scorecard'

export const dynamic = 'force-dynamic'

// ISO 3166 code (FR, US…) → full name (France, United States).
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryLabel(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code || '—'
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

// Friendly label for the `source` recorded when the lead was captured.
function sourceLabel(s: string): string {
  const map: Record<string, string> = {
    'email-only': 'Email sign-up',
    google: 'Google sign-up',
    referral: 'Referral',
    'early-access': 'Early access',
    hero: 'Hero',
    cta: 'CTA',
  }
  return map[s] ?? (s || 'Unknown')
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { source?: string }
}) {
  const { source } = searchParams
  let leads, errors
  try {
    ;({ leads, errors } = await fetchAllSheets())
  } catch (err) {
    return (
      <div style={{ padding: 40, color: 'var(--adm-ink)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p className="adm-section-title">Leads error</p>
        <pre style={{ color: 'rgba(200,60,40,.9)', fontSize: 13, marginTop: 12 }}>{String(err)}</pre>
      </div>
    )
  }

  const errorEntries = Object.entries(errors ?? {})

  // Newest first; every row is one captured lead event.
  const allLeads = [...leads]
    .filter((l) => l.email)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  const uniquePeople = new Set(allLeads.map((l) => l.email.toLowerCase())).size
  const todayParis = parisDate(new Date())
  const todayCount = allLeads.filter((l) => parisDate(l.timestamp) === todayParis).length

  // Source tallies for the quick-filter chips.
  const bySource = new Map<string, number>()
  allLeads.forEach((l) => {
    const s = l.source || 'unknown'
    bySource.set(s, (bySource.get(s) ?? 0) + 1)
  })
  const sourceChips = [...bySource.entries()].sort((a, b) => b[1] - a[1])

  // Optional source filter (?source=referral).
  const filter = (source ?? '').trim().toLowerCase()
  const filtered = filter ? allLeads.filter((l) => (l.source || '').toLowerCase() === filter) : allLeads
  const rows = filtered.slice(0, 250)

  return (
    <main className="adm-page">
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">Dashboard</p>
          <h1 className="adm-page-title">Leads</h1>
          <p className="adm-page-sub">
            One line per captured lead — sign-ups and access requests, newest first (max 250).
            Updated {fmtParis(new Date(), { withSeconds: true })} (Paris).
          </p>
        </div>
      </div>

      {errorEntries.length > 0 && (
        <div style={{ background: 'rgba(255,100,100,.08)', border: '1px solid rgba(255,120,120,.24)', borderLeft: '3px solid rgba(255,120,120,.6)', borderRadius: 3, padding: '12px 16px', marginBottom: 24 }}>
          {errorEntries.map(([sheet, msg]) => (
            <pre key={sheet} style={{ color: 'rgba(200,60,40,.9)', fontSize: 12, margin: '4px 0' }}>{sheet}: {msg}</pre>
          ))}
        </div>
      )}

      <div className="adm-scorecards">
        <Scorecard label="Total Leads" value={allLeads.length.toLocaleString()} subtitle="all captured events" />
        <Scorecard label="Unique People" value={uniquePeople.toLocaleString()} subtitle="distinct emails" />
        <Scorecard label="Today" value={todayCount.toLocaleString()} subtitle="captured today (Paris)" />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <a
          href="/admin/leads"
          className="adm-nav-link"
          style={{ border: '1px solid var(--adm-i08)', padding: '4px 10px', borderRadius: 3, fontSize: '.8rem' }}
        >
          All sources ({allLeads.length})
        </a>
        {sourceChips.map(([s, n]) => (
          <a
            key={s}
            href={`/admin/leads?source=${encodeURIComponent(s)}`}
            className="adm-nav-link"
            style={{ border: '1px solid var(--adm-i08)', padding: '4px 10px', borderRadius: 3, fontSize: '.8rem' }}
          >
            {sourceLabel(s)} ({n})
          </a>
        ))}
      </div>

      {filter && (
        <p className="adm-section-title">
          Filtered: {sourceLabel(filter)} — {rows.length} lead{rows.length === 1 ? '' : 's'}
        </p>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>When (Paris)</th>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => {
              const name = [l.firstName, l.lastName].filter(Boolean).join(' ').trim() || l.fullName.trim()
              return (
                <tr key={`${l.email}-${l.timestamp}-${i}`}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtParis(l.timestamp)}</td>
                  <td style={{ maxWidth: 200 }}>{name || <span className="muted">—</span>}</td>
                  <td>{l.email}</td>
                  <td className="muted">{sourceLabel(l.source)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{countryLabel(l.country)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No leads yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

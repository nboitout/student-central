import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

async function forwardToAppsScript(payload: Record<string, unknown>) {
  const url = process.env.APPS_SCRIPT_URL
  if (!url) {
    console.warn('[lead] APPS_SCRIPT_URL is not set — skipping forward')
    return
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })
    const text = await r.text().catch(() => '')
    console.log('[lead] forward result:', r.status, text.slice(0, 200))
  } catch (err) {
    console.error('[lead] apps script forward failed:', err)
  }
}

// Captures a lead (early-access request, referral, or hero email-first) into the
// "Leads" tab of the analytics Sheet — the same pipeline the dashboard reads.
// Unlike sign-in (which also logs a Lead via the NextAuth event), this path does
// not authenticate anyone: it's for soft leads who submit an email/name without
// creating a session.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    (typeof body.fullName === 'string' ? body.fullName.trim() : '')
  const source = typeof body.source === 'string' && body.source ? body.source : 'early-access'
  const lang = typeof body.lang === 'string' ? body.lang : ''
  const country = req.headers.get('x-vercel-ip-country') ?? ''
  const readerId = req.cookies.get('reader_id')?.value ?? ''

  await forwardToAppsScript({
    type: 'lead',
    timestamp: new Date().toISOString(),
    readerId,
    source,
    firstName,
    lastName,
    fullName,
    email,
    lang,
    country,
    userAgent: req.headers.get('user-agent') ?? '',
    referer: req.headers.get('referer') ?? '',
  })

  return NextResponse.json({ ok: true })
}

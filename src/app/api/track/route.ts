import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { hasInternalTrafficMarker, markInternalTraffic } from '@/lib/internalTraffic'

export const maxDuration = 30

async function forwardToAppsScript(payload: Record<string, unknown>) {
  const url = process.env.APPS_SCRIPT_URL
  if (!url) {
    console.warn('[track] APPS_SCRIPT_URL is not set — skipping forward')
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
    console.log('[track] forward result:', r.status, text.slice(0, 200))
  } catch (err) {
    console.error('[track] apps script forward failed:', err)
  }
}

export async function POST(req: NextRequest) {
  // Don't record internal traffic. As soon as someone visits while logged into
  // admin, we stamp a long-lived internal marker so later public browsing from
  // the same browser also stays out of the sheets.
  if (hasInternalTrafficMarker(req)) {
    const response = NextResponse.json({ ok: true, skipped: 'internal' })
    markInternalTraffic(response)
    return response
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.chapter !== 'string' || typeof body.event !== 'string') {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  const existing = req.cookies.get('reader_id')?.value
  const readerId = existing && /^[0-9a-f-]{36}$/i.test(existing) ? existing : randomUUID()

  const lang: string = typeof body.lang === 'string' ? body.lang : ''
  const sessionId: string = typeof body.sessionId === 'string' ? body.sessionId : ''
  const country: string = req.headers.get('x-vercel-ip-country') ?? ''

  // Forward to the Apps Script → Sheet. Awaited inline (Next 14 has no stable
  // `after()`); the call is best-effort and swallows its own errors.
  await forwardToAppsScript({
    type: 'event',
    timestamp: new Date().toISOString(),
    readerId,
    sessionId,
    chapter: body.chapter,
    event: body.event,
    data: body.data ?? null,
    lang,
    country,
    userAgent: req.headers.get('user-agent') ?? '',
    referer: req.headers.get('referer') ?? '',
  })

  const res = NextResponse.json({ ok: true })

  // Make sure even anonymous visitors get a stable readerId for funnel analysis.
  if (!existing) {
    res.cookies.set('reader_id', readerId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return res
}

import { createPrivateKey, createSign } from 'node:crypto'

// Visitors always hidden from the admin dashboard, in addition to anything set
// via EXCLUDED_READER_IDS in the environment. Add the owner's own reader_ids
// here once known (each device/browser mints its own on first visit).
const ALWAYS_EXCLUDED_READER_IDS: string[] = []

// Emails always hidden from the dashboard, in addition to anything in the
// EXCLUDED_EMAILS env var. Excluding by email catches every device the person
// signs up with — current and future.
const ALWAYS_EXCLUDED_EMAILS: string[] = []

// Team members who should disappear from the dashboard only from a given date
// onward, while preserving any earlier historical traffic.
const DATE_SCOPED_EXCLUSIONS: { startDate: string; emails: string[]; readerIds: string[] }[] = []

// Narrow one-off QA exclusions when the exact reader_id is unavailable.
const VISIT_SIGNATURE_EXCLUSIONS: { date: string; country: string; requireAnonymousLead: boolean }[] = []

// ---- Types ----

export interface LeadRow {
  timestamp: string
  readerId: string
  sessionId: string
  source: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  profession: string
  lang: string
  country: string
  userAgent: string
  referer: string
}

export interface EventRow {
  timestamp: string
  readerId: string
  sessionId: string
  chapter: string
  event: string
  data: string
  lang: string
  country: string
  userAgent: string
  referer: string
}

export interface VisitRow {
  timestamp: string
  event: string
  readerId: string
  sessionId: string
  isReturning: string
  lang: string
  page: string
  country: string
  duration_seconds: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  userAgent: string
  referer: string
}

// ---- In-memory cache ----

interface CacheEntry {
  data: string[][]
  ts: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 1 * 60 * 1000 // 1 min (testing — raise to 5 min in production)

// ---- JWT / OAuth ----

function base64url(input: string | Buffer): string {
  const b = typeof input === 'string' ? Buffer.from(input) : input
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Load the service-account RSA key as a KeyObject, tolerant of how Vercel (and
 * copy/paste) mangle PEM env vars. Two accepted sources:
 *
 *   1. GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 — base64 of the whole PEM.
 *      Immune to newline/escaping issues; recommended if the raw key misbehaves.
 *   2. GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — the raw `private_key` string.
 *
 * Whatever comes in, we reduce it to the pure base64 key body, drop any stray
 * characters (smart quotes, non-breaking spaces, single/double-escaped \n), and
 * rebuild a canonical PEM so the parser can't trip on formatting. This is what
 * defeats the recurring `asn1 ... header too long` error.
 */
function loadServiceAccountKey() {
  let pem: string | null = null

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
  if (b64 && b64.trim()) {
    const decoded = Buffer.from(b64.trim(), 'base64').toString('utf8')
    if (decoded.includes('PRIVATE KEY')) pem = decoded
  }

  if (!pem) {
    let raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    if (!raw) {
      throw new Error(
        'Missing Google service account private key — set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64.'
      )
    }
    raw = raw.trim()
    // Unwrap a single layer of surrounding quotes.
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1)
    }
    // Normalise escaped newlines: \r\n, \n, and double-escaped \\n → real newline.
    raw = raw.replace(/\\r/g, '').replace(/\\+n/g, '\n').replace(/\r/g, '')
    pem = raw
  }

  // Reduce to the pure base64 body: drop PEM markers, then every character that
  // isn't part of the base64 alphabet (kills stray backslashes, smart quotes,
  // NBSP, and any residual whitespace).
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '')

  if (body.length < 1000) {
    throw new Error(
      `Private key looks truncated (${body.length} base64 chars) — check GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is complete.`
    )
  }

  const wrapped = body.match(/.{1,64}/g)!.join('\n')
  const canonicalPem = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`

  try {
    return createPrivateKey({ key: canonicalPem, format: 'pem' })
  } catch {
    // Last resort: decode the body as DER PKCS#8 directly.
    return createPrivateKey({ key: Buffer.from(body, 'base64'), format: 'der', type: 'pkcs8' })
  }
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  if (!email) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable.')
  }

  const privateKey = loadServiceAccountKey()

  const now = Math.floor(Date.now() / 1000)
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss:   email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }))

  const signingInput = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const jwt = `${signingInput}.${base64url(sign.sign(privateKey))}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Failed to get Google access token: ${err}`)
  }

  const tokenData = (await tokenRes.json()) as { access_token: string }
  return tokenData.access_token
}

// ---- Fetch sheet data ----

export async function fetchSheetData(sheetName: string): Promise<string[][]> {
  const cached = cache.get(sheetName)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID environment variable.')
  }

  const accessToken = await getAccessToken()
  const range = encodeURIComponent(`${sheetName}!A:ZZ`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // No cache directive — we handle caching ourselves
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to fetch sheet "${sheetName}": ${err}`)
  }

  const json = (await res.json()) as { values?: string[][] }
  const rows: string[][] = json.values ?? []

  cache.set(sheetName, { data: rows, ts: Date.now() })
  return rows
}

// ---- Map rows to typed objects ----

// "Leads" tab — written by the Apps Script with this 13-column layout:
// timestamp, readerId, sessionId, source, firstName, lastName, fullName,
// email, profession, lang, country, userAgent, referer
function rowsToLeads(rows: string[][]): LeadRow[] {
  if (rows.length < 2) return []
  return rows.slice(1).map((r) => ({
    timestamp:  r[0]  ?? '',
    readerId:   r[1]  ?? '',
    sessionId:  r[2]  ?? '',
    source:     r[3]  ?? '',
    firstName:  r[4]  ?? '',
    lastName:   r[5]  ?? '',
    fullName:   r[6]  ?? '',
    email:      r[7]  ?? '',
    profession: r[8]  ?? '',
    lang:       r[9]  ?? '',
    country:    r[10] ?? '',
    userAgent:  r[11] ?? '',
    referer:    r[12] ?? '',
  }))
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isoDate(timestamp: string): string {
  return timestamp.slice(0, 10)
}

function hasLeadIdentity(readerId: string, leadReaderIds: Set<string>): boolean {
  return leadReaderIds.has(readerId.toLowerCase())
}

function connectionKeyForFilter(row: { sessionId: string; readerId: string; timestamp: string }): string {
  if (row.sessionId) return `sid:${row.sessionId}`
  return `legacy:${row.readerId.toLowerCase()}|${isoDate(row.timestamp)}`
}

// "Events" tab — timestamp, readerId, sessionId, chapter, event, data, lang,
// country, userAgent, referer. Kept for parity with the tracking pipeline; the
// starter Overview does not read events yet.
function rowsToEvents(rows: string[][]): EventRow[] {
  if (rows.length < 2) return []
  return rows.slice(1).map((r) => {
    const newFormat = UUID_RE.test(r[2] ?? '')
    return newFormat
      ? {
          timestamp: r[0] ?? '',
          readerId:  r[1] ?? '',
          sessionId: r[2] ?? '',
          chapter:   r[3] ?? '',
          event:     r[4] ?? '',
          data:      r[5] ?? '',
          lang:      r[6] ?? '',
          country:   r[7] ?? '',
          userAgent: r[8] ?? '',
          referer:   r[9] ?? '',
        }
      : {
          timestamp: r[0] ?? '',
          readerId:  r[1] ?? '',
          sessionId: '',
          chapter:   r[2] ?? '',
          event:     r[3] ?? '',
          data:      r[4] ?? '',
          lang:      '',
          country:   '',
          userAgent: r[5] ?? '',
          referer:   r[6] ?? '',
        }
  })
}

function rowsToVisits(rows: string[][]): VisitRow[] {
  if (rows.length < 2) return []
  return rows.slice(1).map((r) => ({
    timestamp:       r[0]  ?? '',
    event:           r[1]  ?? '',
    readerId:        r[2]  ?? '',
    sessionId:       r[3]  ?? '',
    isReturning:     r[4]  ?? '',
    lang:            r[5]  ?? '',
    page:            r[6]  ?? '',
    country:         r[7]  ?? '',
    duration_seconds: r[8] ?? '',
    utm_source:      r[9]  ?? '',
    utm_medium:      r[10] ?? '',
    utm_campaign:    r[11] ?? '',
    utm_content:     r[12] ?? '',
    utm_term:        r[13] ?? '',
    userAgent:       r[14] ?? '',
    referer:         r[15] ?? '',
  }))
}

// ---- Fetch all sheets ----

async function fetchSheetSafe(sheetName: string): Promise<{ rows: string[][], error: string | null }> {
  try {
    const rows = await fetchSheetData(sheetName)
    return { rows, error: null }
  } catch (err) {
    console.warn(`[sheets] Could not load sheet "${sheetName}":`, err)
    return { rows: [], error: String(err) }
  }
}

export async function fetchAllSheets(): Promise<{
  leads: LeadRow[]
  events: EventRow[]
  visits: VisitRow[]
  errors: Record<string, string>
}> {
  const [leadsResult, eventsResult, visitsResult] = await Promise.all([
    fetchSheetSafe('Leads'),
    fetchSheetSafe('Events'),
    fetchSheetSafe('Visits'),
  ])

  const errors: Record<string, string> = {}
  if (leadsResult.error)  errors['Leads']  = leadsResult.error
  if (eventsResult.error) errors['Events'] = eventsResult.error
  if (visitsResult.error) errors['Visits'] = visitsResult.error

  const excludedEmails = new Set(
    [
      ...ALWAYS_EXCLUDED_EMAILS,
      ...(process.env.EXCLUDED_EMAILS ?? '').split(','),
    ]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )

  // Direct readerId exclusion — bypasses Leads lookup, catches visits with no form submission
  const excludedReaderIds = new Set(
    [
      ...ALWAYS_EXCLUDED_READER_IDS,
      ...(process.env.EXCLUDED_READER_IDS ?? '').split(','),
    ]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )

  const allLeads  = rowsToLeads(leadsResult.rows)
  const allEvents = rowsToEvents(eventsResult.rows)
  const allVisits = rowsToVisits(visitsResult.rows).filter((v) => !v.page.includes('/admin'))

  const datedReaderExclusions = new Map<string, string>()
  DATE_SCOPED_EXCLUSIONS.forEach(({ startDate, readerIds }) => {
    readerIds.forEach((readerId) => {
      const key = readerId.trim().toLowerCase()
      if (!key) return
      const existing = datedReaderExclusions.get(key)
      if (!existing || startDate < existing) datedReaderExclusions.set(key, startDate)
    })
  })

  const datedEmailExclusions = DATE_SCOPED_EXCLUSIONS.flatMap(({ startDate, emails }) =>
    emails
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
      .map((email) => ({ email, startDate }))
  )

  // Also add readerIds found via email lookup in Leads
  allLeads
    .filter((l) => excludedEmails.has(l.email.toLowerCase()))
    .forEach((l) => { if (l.readerId) excludedReaderIds.add(l.readerId.toLowerCase()) })

  // Date-scoped email exclusions can mint new reader_ids over time (new device,
  // cleared cookies, etc.). Add those ids with the same cutoff date instead of
  // excluding them globally, so pre-cutoff history remains visible.
  allLeads.forEach((l) => {
    const email = l.email.toLowerCase()
    const leadDate = isoDate(l.timestamp)
    datedEmailExclusions.forEach(({ email: excludedEmail, startDate }) => {
      if (email !== excludedEmail || leadDate < startDate || !l.readerId) return
      const readerId = l.readerId.toLowerCase()
      const existing = datedReaderExclusions.get(readerId)
      if (!existing || startDate < existing) datedReaderExclusions.set(readerId, startDate)
    })
  })

  const isDatedExcludedReader = (readerId: string, timestamp: string) => {
    const startDate = datedReaderExclusions.get(readerId.toLowerCase())
    return !!startDate && isoDate(timestamp) >= startDate
  }

  const isDatedExcludedLead = (lead: LeadRow) =>
    datedEmailExclusions.some(
      ({ email, startDate }) => lead.email.toLowerCase() === email && isoDate(lead.timestamp) >= startDate
    ) || isDatedExcludedReader(lead.readerId, lead.timestamp)

  // Apply exclusions first
  const cleanLeads = allLeads.filter(
    (l) =>
      !excludedReaderIds.has(l.readerId.toLowerCase()) &&
      !excludedEmails.has(l.email.toLowerCase()) &&
      !isDatedExcludedLead(l)
  )
  const cleanEvents = allEvents.filter(
    (e) => !excludedReaderIds.has(e.readerId.toLowerCase()) && !isDatedExcludedReader(e.readerId, e.timestamp)
  )
  const leadReaderIds = new Set(cleanLeads.map((l) => l.readerId.toLowerCase()).filter(Boolean))
  const cleanVisits = allVisits.filter((v) => {
    if (excludedReaderIds.has(v.readerId.toLowerCase()) || isDatedExcludedReader(v.readerId, v.timestamp)) {
      return false
    }
    return !VISIT_SIGNATURE_EXCLUSIONS.some((rule) => {
      if (isoDate(v.timestamp) !== rule.date) return false
      if ((v.country || '').toUpperCase() !== rule.country) return false
      if (rule.requireAnonymousLead && hasLeadIdentity(v.readerId, leadReaderIds)) return false
      return true
    })
  })

  // --- Traffic-quality filter --------------------------------------------
  // Keep a whole browsing connection only if it accumulated at least
  // MIN_DWELL_SECONDS of active time. A "connection" maps to one browser
  // session (sessionId), with a legacy fallback to readerId+day for older rows.
  // This removes both first visits and later reconnections that last under 4s.
  // Self-declared crawlers are still dropped by user-agent as an explicit guard.
  const MIN_DWELL_SECONDS = 4
  const BOT_UA = /bot|crawl|spider|slurp|mediapartners|bingpreview|google-read-aloud|read-aloud|google web preview|apis-google|feedfetcher|facebookexternal|embedly|quora link preview|pinterest|vkshare|whatsapp|telegram|headless|phantomjs|python-requests|curl|wget|httpclient|go-http-client|java\/|okhttp|axios|node-fetch|libwww|scrapy/i

  // Total active seconds per connection, summed across page_leave fragments.
  const dwellByConnection = new Map<string, number>()
  cleanVisits
    .filter((v) => v.event === 'page_leave')
    .forEach((v) => {
      const n = parseFloat(v.duration_seconds)
      if (isNaN(n) || n <= 0) return
      const key = connectionKeyForFilter(v)
      dwellByConnection.set(key, (dwellByConnection.get(key) ?? 0) + n)
    })

  function keepConnection(row: { timestamp: string; userAgent: string; sessionId: string; readerId: string }): boolean {
    if (BOT_UA.test(row.userAgent ?? '')) return false
    return (dwellByConnection.get(connectionKeyForFilter(row)) ?? 0) >= MIN_DWELL_SECONDS
  }

  const filteredVisits = cleanVisits.filter((v) => keepConnection(v))
  const filteredEvents = cleanEvents.filter((e) => keepConnection(e))

  return {
    leads:  cleanLeads,
    events: filteredEvents,
    visits: filteredVisits,
    errors,
  }
}

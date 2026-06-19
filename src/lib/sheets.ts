import { createPrivateKey, createSign } from 'node:crypto'

// Visitors always hidden from the admin dashboard (operator's own devices),
// in addition to anything set via EXCLUDED_READER_IDS in the environment.
// Start empty for student-central; rely on EXCLUDED_EMAILS for your own account
// (since logged-in traffic carries an email) and add reader_ids here only if you
// need to suppress a specific anonymous device.
const ALWAYS_EXCLUDED_READER_IDS: string[] = []

// Emails always hidden from the dashboard, in addition to anything in the
// EXCLUDED_EMAILS env var. Excluding by email catches every device the person
// signs in with — current and future — so we don't have to keep chasing new
// reader_ids each time the operator signs in.
const ALWAYS_EXCLUDED_EMAILS: string[] = []

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
  userEmail: string
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
  userEmail: string
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

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error('Missing Google service account credentials in environment variables.')
  }

  // Extract raw base64 from PEM — strip markers, quotes and all whitespace/escape variants
  const pemBase64 = rawKey
    .replace(/^["']|["']$/g, '')          // unwrap surrounding quotes
    .replace(/\\n/g, '\n')                // literal \n → real newline
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')                   // remove all whitespace
    .trim()

  if (!pemBase64) throw new Error('Private key is empty after stripping PEM headers.')

  // A 2048-bit RSA PKCS#8 key base64-encodes to ~2176 chars. Flag if suspiciously short.
  if (pemBase64.length < 1000) {
    throw new Error(`Private key base64 is too short (${pemBase64.length} chars) — likely truncated. Expected ~2176 chars.`)
  }

  // Load key from raw DER bytes — bypasses OpenSSL PEM decoder (source of DECODER errors)
  const derBytes = Buffer.from(pemBase64, 'base64')
  const privateKey = createPrivateKey({ key: derBytes, format: 'der', type: 'pkcs8' })

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

// "Leads" tab (optional — registered-user enrichment), same 13-column layout
// as the reference site:
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

// "Events" tab:
// timestamp, readerId, sessionId, chapter, event, data, lang, country,
// userAgent, referer, userEmail
function rowsToEvents(rows: string[][]): EventRow[] {
  if (rows.length < 2) return []
  return rows.slice(1).map((r) => ({
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
    userEmail: r[10] ?? '',
  }))
}

// "Visits" tab:
// timestamp, event, readerId, sessionId, isReturning, lang, page, country,
// duration_seconds, utm_source, utm_medium, utm_campaign, utm_content,
// utm_term, userAgent, referer, userEmail
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
    userEmail:       r[16] ?? '',
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
  // Leads is optional for student-central; a missing tab is not surfaced.
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

  // Direct readerId exclusion — bypasses any lookup, catches anonymous visits.
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

  // Map any excluded email to its reader_id(s), so excluding the operator by
  // email also drops their anonymous (pre-login) homepage visits in the same
  // session — we match on the sessionId shared across the login boundary.
  const sessionsOfExcluded = new Set<string>()
  allVisits
    .filter((v) => v.userEmail && excludedEmails.has(v.userEmail.toLowerCase()))
    .forEach((v) => {
      if (v.readerId) excludedReaderIds.add(v.readerId.toLowerCase())
      if (v.sessionId) sessionsOfExcluded.add(v.sessionId)
    })
  allVisits
    .filter((v) => v.sessionId && sessionsOfExcluded.has(v.sessionId))
    .forEach((v) => { if (v.readerId) excludedReaderIds.add(v.readerId.toLowerCase()) })

  // Apply exclusions first
  const isExcludedVisit = (v: VisitRow) =>
    excludedReaderIds.has(v.readerId.toLowerCase()) ||
    (v.userEmail ? excludedEmails.has(v.userEmail.toLowerCase()) : false)

  const cleanLeads  = allLeads.filter((l) => !excludedReaderIds.has(l.readerId.toLowerCase()) && !excludedEmails.has(l.email.toLowerCase()))
  const cleanEvents = allEvents.filter((e) => !excludedReaderIds.has(e.readerId.toLowerCase()) && !(e.userEmail && excludedEmails.has(e.userEmail.toLowerCase())))
  const cleanVisits = allVisits.filter((v) => !isExcludedVisit(v))

  // --- Traffic-quality filter --------------------------------------------
  // A real visitor stays a few seconds; a bot or an instant bounce does not.
  // Keep a reader's visits only if they accumulated at least MIN_DWELL_SECONDS
  // of active time (summed from page_leave events, which crawlers never
  // produce). Self-declared crawlers are dropped by user-agent as a cheap
  // explicit guard. Logged-in users are always kept — a real human signed in.
  const MIN_DWELL_SECONDS = 4
  const BOT_UA = /bot|crawl|spider|slurp|mediapartners|bingpreview|google-read-aloud|read-aloud|google web preview|apis-google|feedfetcher|facebookexternal|embedly|quora link preview|pinterest|vkshare|whatsapp|telegram|headless|phantomjs|python-requests|curl|wget|httpclient|go-http-client|java\/|okhttp|axios|node-fetch|libwww|scrapy/i

  // Total active seconds per reader, summed across their page_leave events.
  const dwellByReader = new Map<string, number>()
  cleanVisits
    .filter((v) => v.event === 'page_leave')
    .forEach((v) => {
      const n = parseFloat(v.duration_seconds)
      if (!isNaN(n) && n > 0) dwellByReader.set(v.readerId, (dwellByReader.get(v.readerId) ?? 0) + n)
    })

  const filteredVisits = cleanVisits.filter((v) => {
    if (v.userEmail) return true                                     // signed-in human
    if (BOT_UA.test(v.userAgent ?? '')) return false                 // self-declared crawler
    return (dwellByReader.get(v.readerId) ?? 0) >= MIN_DWELL_SECONDS  // stayed long enough to be real
  })

  return {
    leads:  cleanLeads,
    events: cleanEvents,
    visits: filteredVisits,
    errors,
  }
}

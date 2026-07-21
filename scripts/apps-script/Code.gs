/**
 * Student Central — analytics ingest (Google Apps Script web app).
 *
 * Receives JSON POSTs from the Next.js app (/api/visit and /api/track) and
 * appends them as rows to this spreadsheet. The COLUMN ORDER below MUST stay
 * in sync with src/lib/sheets.ts (rowsToVisits / rowsToEvents / rowsToLeads),
 * which reads the rows back BY INDEX — reordering a column silently corrupts
 * the dashboard.
 *
 * Setup:
 *   1. Paste this into the Apps Script editor bound to (or pointed at) the Sheet.
 *   2. Set SHEET_ID below to the spreadsheet id — the SAME value you put in the
 *      Vercel GOOGLE_SHEETS_ID env var. (Leave '' only if this script is
 *      container-bound to the Sheet, i.e. created via Extensions > Apps Script.)
 *   3. Deploy > New deployment > type "Web app":
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Copy the /exec URL into the Vercel APPS_SCRIPT_URL env var.
 *   4. Re-deploy (new version) whenever you change this file.
 */

// If this script is bound to the Sheet you can leave this ''. Otherwise paste
// the spreadsheet id (the long id in the Sheet URL, == Vercel GOOGLE_SHEETS_ID).
var SHEET_ID = '';

// Column layouts — order is authoritative, must match src/lib/sheets.ts.
var HEADERS = {
  Visits: [
    'timestamp', 'event', 'readerId', 'sessionId', 'isReturning', 'lang',
    'page', 'country', 'duration_seconds', 'utm_source', 'utm_medium',
    'utm_campaign', 'utm_content', 'utm_term', 'userAgent', 'referer'
  ],
  Events: [
    'timestamp', 'readerId', 'sessionId', 'chapter', 'event', 'data',
    'lang', 'country', 'userAgent', 'referer'
  ],
  Leads: [
    'timestamp', 'readerId', 'sessionId', 'source', 'firstName', 'lastName',
    'fullName', 'email', 'profession', 'lang', 'country', 'userAgent', 'referer'
  ]
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // serialize concurrent appends

    var payload = JSON.parse(e.postData.contents);

    // Route by explicit type, falling back to a shape heuristic.
    var type = payload.type;
    if (!type) {
      if (payload.page !== undefined) type = 'visit';
      else if (payload.chapter !== undefined) type = 'event';
      else if (payload.email !== undefined) type = 'lead';
    }

    var tab, row;
    if (type === 'visit') {
      tab = 'Visits';
      row = buildRow(HEADERS.Visits, payload);
    } else if (type === 'event') {
      tab = 'Events';
      row = buildRow(HEADERS.Events, {
        timestamp: payload.timestamp,
        readerId:  payload.readerId,
        sessionId: payload.sessionId,
        chapter:   payload.chapter,
        event:     payload.event,
        data:      stringifyData(payload.data),
        lang:      payload.lang,
        country:   payload.country,
        userAgent: payload.userAgent,
        referer:   payload.referer
      });
    } else if (type === 'lead') {
      tab = 'Leads';
      row = buildRow(HEADERS.Leads, payload);
    } else {
      return json({ ok: false, error: 'Unknown payload type' });
    }

    getSheet(tab).appendRow(row);
    return json({ ok: true, tab: tab });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Health check — visiting the /exec URL in a browser returns this.
function doGet() {
  return json({ ok: true, service: 'student-central analytics ingest' });
}

/** Order payload fields into a row per `headers`; missing fields become ''. */
function buildRow(headers, payload) {
  return headers.map(function (key) {
    var v = payload[key];
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return v;
  });
}

function stringifyData(data) {
  if (data === undefined || data === null) return '';
  if (typeof data === 'string') return data;
  try { return JSON.stringify(data); } catch (e) { return String(data); }
}

/** Return the named tab, creating it with a header row if it doesn't exist. */
function getSheet(name) {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet — set SHEET_ID at the top of Code.gs.');
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Student Central — access-monitoring sink (Google Apps Script).
 *
 * Bind this script to the Google Sheet that stores the access logs, then deploy
 * it as a Web App (Deploy ▸ New deployment ▸ Web app):
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the resulting /exec URL into the APPS_SCRIPT_URL environment variable.
 *
 * The Next.js routes /api/visit and /api/track POST a JSON payload whose `type`
 * field ("visit" | "event") names the target tab. Rows are appended in the
 * column order defined by each tab's HEADER row, so you can reorder/extend
 * columns in the sheet without touching this script — just keep the header
 * names matching the payload keys below.
 *
 * Create these tabs with a header row (row 1) exactly as listed:
 *
 *   Visits:
 *     timestamp | event | readerId | sessionId | isReturning | lang | page |
 *     country | duration_seconds | utm_source | utm_medium | utm_campaign |
 *     utm_content | utm_term | userAgent | referer | userEmail
 *
 *   Events:
 *     timestamp | readerId | sessionId | chapter | event | data | lang |
 *     country | userAgent | referer | userEmail
 *
 *   Leads (optional):
 *     timestamp | readerId | sessionId | source | firstName | lastName |
 *     fullName | email | profession | lang | country | userAgent | referer
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var type = String(payload.type || '').toLowerCase();

    var tabByType = { visit: 'Visits', event: 'Events', lead: 'Leads' };
    var tabName = tabByType[type];
    if (!tabName) {
      return jsonOut({ ok: false, error: 'Unknown type: ' + type });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      return jsonOut({ ok: false, error: 'Missing tab: ' + tabName });
    }

    // Map payload keys onto the sheet's header columns (row 1), in order.
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var row = headers.map(function (h) {
      var key = String(h).trim();
      var v = payload[key];
      if (v === undefined || v === null) return '';
      return typeof v === 'object' ? JSON.stringify(v) : v;
    });

    sheet.appendRow(row);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOut({ ok: true, service: 'student-central access-monitoring sink' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

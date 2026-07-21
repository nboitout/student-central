# Analytics ingest — Google Apps Script

`Code.gs` is the web app behind the `APPS_SCRIPT_URL` env var. It receives JSON
POSTs from `/api/visit` and `/api/track` and appends them as rows to the Google
Sheet that the admin dashboard reads back via `src/lib/sheets.ts`.

## Deploy

1. Open the Sheet → **Extensions → Apps Script** (this binds the script to the
   Sheet, so you can leave `SHEET_ID = ''`). Alternatively create a standalone
   script and set `SHEET_ID` to the spreadsheet id (same as Vercel `GOOGLE_SHEETS_ID`).
2. Paste the contents of `Code.gs`.
3. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Copy the `…/exec` URL into Vercel as `APPS_SCRIPT_URL`.
5. After any edit, **Deploy → Manage deployments → Edit → New version** (the
   `/exec` URL stays the same).

## Notes

- The `Visits`, `Events`, and `Leads` tabs are created automatically with a
  header row on first write. **Do not reorder columns** — `src/lib/sheets.ts`
  reads rows by index; the header labels are for humans only.
- The service account in `GOOGLE_SERVICE_ACCOUNT_EMAIL` needs **Viewer** access
  to the Sheet (Share → add that email) so the dashboard can read it back.
- Health check: open the `/exec` URL in a browser → `{"ok":true,...}`.

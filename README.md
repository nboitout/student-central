# Student Central — Faculty Assessment Intelligence

A Next.js 14 homepage for Student Central: reasoning-aware assessment for higher education.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **CSS Modules** — component-scoped styles, no runtime CSS-in-JS
- **Google Fonts** — Space Grotesk (display) + Inter (body), loaded via `<link>` in `layout.tsx`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    globals.css          # Design tokens + shared utilities (.ribbon, .btn-p, .btn-s, .reveal)
    layout.tsx           # Root layout — metadata + Google Fonts
    page.tsx             # Page — assembles all section components
  components/
    Nav                  # Fixed glassmorphism navigation
    Hero                 # MCQ assessment visual + faculty insight panel
    DividerBar           # Marquee-style keyword strip
    Problem              # Why MCQs are not enough (3 cards)
    Approach             # Quadrant outcome model (4 states)
    Workflow             # 4-step faculty workflow
    Faculty              # Dashboard tiles + insight examples
    Pedagogy             # 3-column value props + punchline strip
    Trust                # Academic integrity / governance (4 blocks)
    Institutional        # Deployment story + who it's for
    CTA                  # Closing call to action
    Footer
    ScrollReveal         # "use client" IntersectionObserver for .reveal animations
```

## Design System

All design tokens live in `src/app/globals.css` as CSS custom properties:

- **Colors**: `--primary` (#003cc2), surface hierarchy (lowest → highest), `--on-surface-variant` (#434656)
- **Gradients**: `--primary-gradient` (135deg, #003cc2 → #0050fa) — used on CTAs, hero text, accent bars
- **Typography**: `--font-display` (Space Grotesk), `--font-body` (Inter)
- **Shadows**: `--shadow-ambient`, `--shadow-float`
- **Rules**: 0px border-radius everywhere, no 1px dividers, background-shift depth model

## Access Monitoring (`/admin`)

A password-protected dashboard that shows who is accessing the site, when, from
where, on which pages, and how they convert from anonymous homepage visitors
into signed-in users. Modeled on the analytics system used by the ROP site.

**How it works**
1. `src/components/VisitTracker.tsx` (mounted in the root layout) records a
   `page_visit` on every navigation and a `page_leave` with active dwell time,
   for both the public marketing pages and the authenticated app. It POSTs to
   `/api/visit`; custom events can be sent to `/api/track`.
2. Those routes stamp each event with the geo country, an anonymous `reader_id`
   cookie, and — when the visitor is logged in — their email, then forward the
   row to a Google Apps Script web app (`APPS_SCRIPT_URL`) that appends it to a
   Google Sheet.
3. `/admin/*` reads the sheet back via a Google service account (`src/lib/sheets.ts`)
   and renders the Overview, Visits, Engagement, Users, and Funnel pages. Bots
   and the operator's own traffic are filtered out.

**Setup**
1. Create a Google Sheet with `Visits`, `Events` (and optional `Leads`) tabs and
   the header rows documented in `docs/apps-script.gs`.
2. Add the bound Apps Script from `docs/apps-script.gs`, deploy it as a Web App,
   and put its `/exec` URL in `APPS_SCRIPT_URL`.
3. Create a Google Cloud service account (Sheets API enabled), share the sheet
   with it as Viewer, and set `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
   `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
4. Set `ADMIN_PASSWORD`. Optionally add your own address to `EXCLUDED_EMAILS`.

See `.env.example` for the full list of variables.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds and deploys to Vercel.

Required repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

- Test
- Secrets updated
## sympa !!!!
## re-sumpa !!!!! 

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

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds and deploys to Vercel.

Required repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

- Test

# Code Review Findings

## Scope
Reviewed the authentication, middleware, API client, and workspace/login flows.

## Findings

### 1) Middleware trusts cookie presence instead of verifying auth (High)
- `src/middleware.ts` currently grants access to `/workspace` routes when a session cookie exists, without verifying token validity or session state.
- A forged or stale cookie can pass this check and allow access to protected UI routes.
- Recommendation: use `auth()` (Auth.js/NextAuth) inside middleware or server-side route protection so access decisions are based on verified session state, not cookie presence.

### 2) Secure cookies are hard-forced in all environments (High)
- In `src/auth.ts`, both session and callback cookies set `secure: true` unconditionally.
- This prevents cookies from being set over plain HTTP in local development, causing sign-in/session persistence failures outside HTTPS.
- Recommendation: make `secure` conditional on environment (`process.env.NODE_ENV === "production"`) or rely on Auth.js defaults.

### 3) Client API layer uses global mutable fallback identity (High)
- `src/lib/api.ts` initializes `_currentUserId` to `"nicolas"` and exposes mutable global state via `setCurrentUser`.
- Multiple calls fallback to this value if session loading fails or userId is omitted. `WorkspacePage` also calls API methods without always passing `userId` (e.g., polling), which can unintentionally target fallback identity.
- Risk: cross-user data leakage in shared client contexts, incorrect ownership on API calls, and hidden auth bugs.
- Recommendation: remove fallback identity, require explicit user identity from verified session, and fail closed when identity is unavailable.

### 4) DELETE request does not validate HTTP result (Medium)
- `deleteCourse` in `src/lib/api.ts` uses `fetch` directly and does not check `res.ok`.
- UI can optimistically remove items even when server-side delete fails, creating client/server drift.
- Recommendation: route all mutating calls through shared `request()` helper or explicitly validate status and throw on non-2xx.

### 5) Linting is not CI-ready due to interactive setup prompt (Low)
- Running `npm run lint` triggers Next.js ESLint setup prompt because no ESLint config is present.
- This blocks non-interactive CI and local automation.
- Recommendation: commit a baseline ESLint config (`next/core-web-vitals`), then enforce in CI.

## Positive Notes
- Production build completes successfully and routes are generated as expected.
- Session and API typing is comprehensive and mostly consistent across camelCase/snake_case payloads.

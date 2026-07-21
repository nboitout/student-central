import type { NextRequest, NextResponse } from 'next/server'

// Traffic from the site owner / admins is kept out of the analytics sheets.
// The marker is a long-lived cookie set whenever an admin browses the /admin
// area (see src/middleware.ts). Once set, later public browsing from the same
// browser also stays out of the sheets — the same behaviour as ROP.
export const INTERNAL_TRAFFIC_COOKIE = 'internal_traffic'
const ONE_YEAR = 60 * 60 * 24 * 365

export function hasInternalTrafficMarker(req: NextRequest): boolean {
  return !!req.cookies.get(INTERNAL_TRAFFIC_COOKIE)
}

export function markInternalTraffic(response: NextResponse): void {
  response.cookies.set(INTERNAL_TRAFFIC_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_YEAR,
    path: '/',
  })
}

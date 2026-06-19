import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_session'
const ONE_DAY = 60 * 60 * 24

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { password?: string }
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!body.password || body.password.trim() !== adminPassword.trim()) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_DAY,
    path: '/',
  })
  return response
}

export async function DELETE(_req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}

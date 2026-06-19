import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── Admin access monitoring dashboard ──────────────────────────────
     Password-gated via the `admin_session` cookie set by /api/admin/auth.
     The login page itself is always reachable.                          */
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const adminSession = req.cookies.get("admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  /* NextAuth v5 / Auth.js uses "authjs.session-token" (with __Secure- prefix on HTTPS) */
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  if (pathname.startsWith("/workspace") && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/admin/:path*"],
};

import { NextRequest, NextResponse } from "next/server";
import { markInternalTraffic } from "@/lib/internalTraffic";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* NextAuth v5 / Auth.js uses "authjs.session-token" (with __Secure- prefix on HTTPS) */
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  const isGuarded =
    pathname.startsWith("/workspace") || pathname.startsWith("/admin");

  /* Fast redirect for unauthenticated users. The admin allowlist itself is
     enforced server-side in the admin layout (middleware can't cheaply decode
     the JWT to read the email). */
  if (isGuarded && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* Any authenticated browse of /admin means an admin is at the keyboard, so
     stamp the internal-traffic marker to keep the owner's own later browsing
     out of the analytics sheets (mirrors ROP's admin-auth behaviour). */
  if (pathname.startsWith("/admin") && sessionToken) {
    const res = NextResponse.next();
    markInternalTraffic(res);
    return res;
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/admin/:path*"],
};

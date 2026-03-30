import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn  = !!req.auth;

  /* Protect /workspace and all sub-routes */
  if (pathname.startsWith("/workspace") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* Redirect logged-in users away from /login */
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/workspace", req.url));
  }
});

export const config = {
  matcher: ["/workspace/:path*", "/login"],
};

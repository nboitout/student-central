"use client";

import { ReactNode } from "react";

/* NextAuth v5 with App Router does not need a client SessionProvider —
   the session is read server-side via auth() and passed down as props,
   or accessed client-side via the useAuth hook below.                  */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

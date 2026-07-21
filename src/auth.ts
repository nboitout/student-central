import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/* ── Admin allowlist ────────────────────────────────────────────────
   The /admin dashboard is gated by email. Set ADMIN_EMAILS in the
   environment to a comma-separated list (e.g. "you@x.com, teammate@y.com").
   Comparison is case-insensitive. Enforced server-side in the admin
   layout — see src/app/admin/layout.tsx.                              */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/* ── Sign-up monitoring ─────────────────────────────────────────────
   Log each successful sign-in (Google or email-only) as a row in the
   "Leads" tab of the analytics Sheet, so the admin dashboard's Total
   Readers / Conversion cards populate. `source` records which method was
   used ("google" vs "email-only"). Fire-and-forget: a logging failure
   never blocks the sign-in. Admin emails are skipped so signing in to
   /admin doesn't inflate the reader count. The dashboard counts distinct
   emails, so re-logins don't double-count.                             */
async function logSignInAsLead(email?: string | null, name?: string | null, provider?: string) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url || !email || isAdminEmail(email)) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "lead",
        timestamp: new Date().toISOString(),
        source: provider ?? "",
        email,
        fullName: name ?? "",
      }),
    });
  } catch (err) {
    console.error("[auth] sign-up lead logging failed:", err);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    /* ── Temporary: email-only access for controlled testing phase ──────
       No password, no verification — any valid email format is accepted.
       The backend has no auth enforcement; userId is passed as a plain
       string. Remove this provider when JWT + Google OAuth is enforced.  */
    Credentials({
      id:   "email-only",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim() ?? "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        return { id: email, email, name: email };
      },
    }),

    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  session: { strategy: "jwt", maxAge: THIRTY_DAYS },

  /* Persist cookies across browser restarts by adding maxAge to the cookie itself.
     useSecureCookies=true in production so the prefix is __Secure-               */
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
        maxAge: THIRTY_DAYS,
      },
    },
    callbackUrl: {
      name: "__Secure-authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
        maxAge: THIRTY_DAYS,
      },
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.id = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
  },

  events: {
    async signIn({ user, account }) {
      await logSignInAsLead(user?.email, user?.name, account?.provider);
    },
  },
});

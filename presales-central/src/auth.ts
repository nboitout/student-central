import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

/* Comma-separated list of allowed emails, e.g. "alice@co.com,bob@co.com"
   If not set, any valid email is accepted (useful during initial setup). */
const BLOCKED_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "hotmail.com", "hotmail.fr", "hotmail.co.uk", "hotmail.de", "hotmail.es", "hotmail.it",
  "outlook.com", "outlook.fr", "outlook.de", "outlook.es", "outlook.it",
  "live.com", "live.fr", "live.co.uk",
  "yahoo.com", "yahoo.fr", "yahoo.co.uk", "yahoo.de", "yahoo.es", "yahoo.it",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "protonmail.com", "proton.me",
  "mail.com", "gmx.com", "gmx.de", "gmx.fr",
  "msn.com", "wanadoo.fr", "orange.fr", "sfr.fr", "free.fr", "laposte.net",
  "yandex.com", "yandex.ru", "mail.ru",
]);

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS
  ? process.env.ALLOWED_EMAILS.split(",").map(e => e.trim().toLowerCase())
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id:   "email-only",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase() ?? "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        const domain = email.split("@")[1];
        if (BLOCKED_DOMAINS.has(domain)) return null;
        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) return null;
        return { id: email, email, name: email };
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: THIRTY_DAYS },

  /* Let NextAuth manage cookie names automatically.
     In production it uses __Secure- prefix + secure:true; in dev it uses plain cookies over HTTP. */
  ...(!isProd && {
    cookies: {
      sessionToken: {
        name: "authjs.session-token",
        options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: false },
      },
    },
  }),

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    async session({ session, token }) {
      if (token.email && session.user) session.user.id = token.email;
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
  },
});

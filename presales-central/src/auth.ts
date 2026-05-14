import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

/* Comma-separated list of allowed emails, e.g. "alice@co.com,bob@co.com"
   If not set, any valid email is accepted (useful during initial setup). */
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

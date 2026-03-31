import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  session: { strategy: "jwt", maxAge: THIRTY_DAYS },

  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: THIRTY_DAYS,   /* makes cookie persistent across browser restarts */
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
});

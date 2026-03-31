import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from:   "Student Central <noreply@studentcentral.ai>",
      name:   "Email",
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn:        "/login",
    error:         "/login",
    verifyRequest: "/login?verify=1",
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

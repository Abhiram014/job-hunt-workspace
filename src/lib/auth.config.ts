import type { NextAuthConfig } from "next-auth";

// Edge-safe base config: no Prisma, no bcrypt, no providers with server-side
// dependencies. Used directly by middleware (which runs on the Edge runtime
// with a strict bundle size limit) and extended with the real Credentials
// provider in auth.ts for everywhere else (Node.js runtime).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

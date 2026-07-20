import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserById } from "@/lib/json/store";
import { verifyLoginTicket } from "@/lib/steam/ticket";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 365 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      id: "steam-ticket",
      name: "Steam",
      credentials: { ticket: { label: "Ticket", type: "text" } },
      async authorize(credentials) {
        if (!credentials?.ticket) return null;
        const payload = verifyLoginTicket(credentials.ticket);
        if (!payload) return null;

        const user = await findUserById(payload.userId);
        if (!user || user.steamId64 !== payload.steamId64) return null;

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          role: "USER",
          steamId64: user.steamId64,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.steamId64 = (user as { steamId64?: string }).steamId64;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.steamId64 = token.steamId64 as string | undefined;
      }
      return session;
    },
  },
};

import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyLoginTicket } from "@/lib/steam/ticket";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      id: "steam-ticket",
      name: "Steam",

      credentials: {
        ticket: {
          label: "Ticket",
          type: "text",
        },
      },

      async authorize(credentials) {
        if (!credentials?.ticket) {
          console.error("[Steam Auth] Ticket absent");
          return null;
        }

        const payload = verifyLoginTicket(credentials.ticket);

        if (!payload) {
          console.error("[Steam Auth] Ticket invalide ou expiré");
          return null;
        }

        if (!payload.userId || !payload.steamId64) {
          console.error("[Steam Auth] Contenu du ticket incomplet");
          return null;
        }

        return {
          id: payload.userId,
          name: "Utilisateur Steam",
          image: null,
          role: "USER",
          steamId64: payload.steamId64,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.steamId64 = (
          user as {
            steamId64?: string;
          }
        ).steamId64;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.userId === "string" ? token.userId : "";

        session.user.role =
          typeof token.role === "string" ? token.role : "USER";

        session.user.steamId64 =
          typeof token.steamId64 === "string"
            ? token.steamId64
            : undefined;
      }

      return session;
    },
  },
};
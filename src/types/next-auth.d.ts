import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      steamId64?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    steamId64?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: string;
    steamId64?: string;
  }
}

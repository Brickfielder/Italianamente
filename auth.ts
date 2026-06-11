import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { getDb, hasDatabase } from "./lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "./lib/db/schema";

export const isStudioConfigured = () =>
  hasDatabase() &&
  Boolean(process.env.AUTH_SECRET) &&
  Boolean(process.env.AUTH_RESEND_KEY) &&
  Boolean(process.env.AUTH_ALLOWED_EMAIL);

const adapter = hasDatabase()
  ? DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  secret: process.env.AUTH_SECRET || "studio-build-only-secret",
  trustHost: true,
  session: { strategy: adapter ? "database" : "jwt" },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY || "not-configured",
      from:
        process.env.AUTH_EMAIL_FROM ||
        "Italianamente Studio <studio@example.com>",
    }),
  ],
  callbacks: {
    signIn({ user }) {
      const allowed = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
      return Boolean(allowed && user.email?.toLowerCase() === allowed);
    },
    authorized({ auth: session }) {
      const allowed = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
      return Boolean(
        allowed && session?.user?.email?.toLowerCase() === allowed
      );
    },
  },
});


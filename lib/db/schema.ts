import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("studio_user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "studio_account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("studio_session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "studio_verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (token) => ({
    pk: primaryKey({ columns: [token.identifier, token.token] }),
  })
);

export const drafts = pgTable("studio_draft", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentPath: text("document_path").notNull().unique(),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  payload: jsonb("payload").notNull(),
  baseSha: text("base_sha"),
  previewBranch: text("preview_branch"),
  pullRequestNumber: integer("pull_request_number"),
  previewUrl: text("preview_url"),
  status: text("status").notNull().default("draft"),
  userId: text("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const auditEvents = pgTable("studio_audit_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  draftId: uuid("draft_id").references(() => drafts.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});


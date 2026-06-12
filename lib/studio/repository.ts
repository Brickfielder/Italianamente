import { eq } from "drizzle-orm";

import { getDb } from "../db";
import { auditEvents, drafts } from "../db/schema";
import type { StudioDocument } from "./types";

export async function saveDraft(document: StudioDocument, userId?: string) {
  const db = getDb();
  const payload = { ...document, id: undefined };
  const [saved] = await db
    .insert(drafts)
    .values({
      documentPath: document.documentPath,
      documentType: document.documentType,
      title: document.title,
      payload,
      baseSha: document.baseSha,
      previewBranch: document.previewBranch,
      pullRequestNumber: document.pullRequestNumber,
      previewUrl: document.previewUrl,
      status: document.draftStatus || "draft",
      userId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: drafts.documentPath,
      set: {
        documentType: document.documentType,
        title: document.title,
        payload,
        baseSha: document.baseSha,
        previewBranch: document.previewBranch,
        pullRequestNumber: document.pullRequestNumber,
        previewUrl: document.previewUrl,
        status: document.draftStatus || "draft",
        userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await db.insert(auditEvents).values({
    draftId: saved.id,
    userId,
    action: "draft.saved",
    metadata: { documentPath: document.documentPath },
  });

  return { ...document, id: saved.id };
}

export async function listDrafts() {
  return getDb().select().from(drafts);
}

export async function getDraft(id: string) {
  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.id, id))
    .limit(1);
  return draft;
}

export async function deleteDraftByPath(
  documentPath: string,
  userId?: string
) {
  const [draft] = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.documentPath, documentPath))
    .limit(1);

  if (!draft) {
    return;
  }

  await getDb().insert(auditEvents).values({
    draftId: draft.id,
    userId,
    action: "draft.deleted",
    metadata: { documentPath },
  });
  await getDb().delete(drafts).where(eq(drafts.id, draft.id));
}

export async function updateDraftPublishing(
  id: string,
  values: {
    baseSha?: string;
    previewBranch?: string;
    pullRequestNumber?: number;
    previewUrl?: string | null;
    status: string;
  },
  userId?: string
) {
  const [updated] = await getDb()
    .update(drafts)
    .set({
      ...values,
      userId,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, id))
    .returning();

  await getDb().insert(auditEvents).values({
    draftId: id,
    userId,
    action: `draft.${values.status}`,
    metadata: values,
  });

  return updated;
}

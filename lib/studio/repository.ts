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

export async function listDraftDocuments(): Promise<StudioDocument[]> {
  const rows = await listDrafts();

  return rows.map((draft) => ({
    ...(draft.payload as StudioDocument),
    id: draft.id,
    baseSha: draft.baseSha ?? undefined,
    previewBranch: draft.previewBranch ?? undefined,
    pullRequestNumber: draft.pullRequestNumber ?? undefined,
    previewUrl: draft.previewUrl ?? undefined,
    draftStatus: draft.status,
  }));
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
    bundledDocumentPaths?: string[];
    status: string;
  },
  userId?: string
) {
  const { bundledDocumentPaths, ...publishingValues } = values;
  const draft =
    bundledDocumentPaths === undefined ? undefined : await getDraft(id);
  const [updated] = await getDb()
    .update(drafts)
    .set({
      ...publishingValues,
      ...(draft
        ? {
            payload: {
              ...(draft.payload as StudioDocument),
              bundledDocumentPaths,
            },
          }
        : {}),
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

export async function completeDraftPublishing(
  id: string,
  userId?: string
) {
  const draft = await getDraft(id);
  if (!draft) {
    return;
  }

  const payload = {
    ...(draft.payload as StudioDocument),
    contentOrigin: "repository" as const,
    baseSha: undefined,
    previewBranch: undefined,
    pullRequestNumber: undefined,
    pullRequestUrl: undefined,
    previewUrl: undefined,
    draftStatus: "published",
    bundledDocumentPaths: undefined,
  };
  const [updated] = await getDb()
    .update(drafts)
    .set({
      payload,
      baseSha: null,
      previewBranch: null,
      pullRequestNumber: null,
      previewUrl: null,
      status: "published",
      userId,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, id))
    .returning();

  await getDb().insert(auditEvents).values({
    draftId: id,
    userId,
    action: "draft.published",
    metadata: { documentPath: draft.documentPath },
  });

  return updated;
}

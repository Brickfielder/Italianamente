import { NextResponse } from "next/server";

import {
  closeDocumentPreview,
  publishPreview,
} from "../../../../lib/studio/github";
import {
  completeDraftPublishing,
  getDraft,
  listDraftDocuments,
} from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";
import type { StudioDocument } from "../../../../lib/studio/types";

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser();
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      throw new Error("Missing draft id.");
    }

    const draft = await getDraft(id);
    if (!draft?.pullRequestNumber) {
      throw new Error("Create a preview before publishing.");
    }
    const document = {
      ...(draft.payload as StudioDocument),
      id: draft.id,
    };
    const bundledDocumentPaths = new Set(
      document.bundledDocumentPaths ?? []
    );
    const relatedDocuments = (await listDraftDocuments()).filter(
      (candidate) =>
        candidate.documentType === "post" &&
        bundledDocumentPaths.has(candidate.documentPath)
    );

    const result = await publishPreview({
      pullRequestNumber: draft.pullRequestNumber,
      baseSha: draft.baseSha,
    });
    await completeDraftPublishing(id, user.id);
    await Promise.all(
      relatedDocuments.map(async (relatedDocument) => {
        await closeDocumentPreview(relatedDocument);
        if (relatedDocument.id) {
          await completeDraftPublishing(relatedDocument.id, user.id);
        }
      })
    );
    return NextResponse.json({
      ...result,
      publishedDocumentPaths: [
        document.documentPath,
        ...relatedDocuments.map((item) => item.documentPath),
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

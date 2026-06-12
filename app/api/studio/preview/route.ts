import { NextResponse } from "next/server";

import { createPreview } from "../../../../lib/studio/github";
import {
  listDraftDocuments,
  saveDraft,
  updateDraftPublishing,
} from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";
import type { StudioDocument } from "../../../../lib/studio/types";
import { linkedNewPosts } from "../../../../lib/studio/ui";

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser();
    const input = (await request.json()) as StudioDocument;
    const saved = await saveDraft(input, user.id);
    const relatedDocuments = linkedNewPosts(
      saved,
      await listDraftDocuments()
    );
    const preview = await createPreview(saved, relatedDocuments);
    await updateDraftPublishing(
      saved.id!,
      {
        baseSha: preview.baseSha,
        previewBranch: preview.branch,
        pullRequestNumber: preview.pullRequestNumber,
        previewUrl: preview.previewUrl,
        bundledDocumentPaths: relatedDocuments.map(
          (document) => document.documentPath
        ),
        status: "preview",
      },
      user.id
    );

    return NextResponse.json({
      ...saved,
      ...preview,
      draftStatus: "preview",
      bundledDocumentPaths: relatedDocuments.map(
        (document) => document.documentPath
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create preview.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { createPreview } from "../../../../lib/studio/github";
import {
  saveDraft,
  updateDraftPublishing,
} from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";
import type { StudioDocument } from "../../../../lib/studio/types";

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser();
    const input = (await request.json()) as StudioDocument;
    const saved = await saveDraft(input, user.id);
    const preview = await createPreview(saved);
    await updateDraftPublishing(
      saved.id!,
      {
        baseSha: preview.baseSha,
        previewBranch: preview.branch,
        pullRequestNumber: preview.pullRequestNumber,
        previewUrl: preview.previewUrl,
        status: "preview",
      },
      user.id
    );

    return NextResponse.json({ ...saved, ...preview, draftStatus: "preview" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create preview.";
    return NextResponse.json({ message }, { status: 400 });
  }
}


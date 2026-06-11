import { NextResponse } from "next/server";

import { hasPreviewLookup, getPreviewUrl, getPullRequestUrl } from "../../../../lib/studio/github";
import { getDraft, updateDraftPublishing } from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser();
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      throw new Error("Missing draft id.");
    }

    const draft = await getDraft(id);
    if (!draft) {
      throw new Error("Draft not found.");
    }

    const pullRequestUrl = draft.pullRequestNumber
      ? getPullRequestUrl(draft.pullRequestNumber)
      : null;

    if (!draft.previewBranch || !hasPreviewLookup()) {
      return NextResponse.json({
        previewUrl: draft.previewUrl ?? null,
        pullRequestUrl,
        ready: Boolean(draft.previewUrl),
        lookupEnabled: false,
      });
    }

    const previewUrl = await getPreviewUrl(draft.previewBranch);
    if (previewUrl && previewUrl !== draft.previewUrl) {
      await updateDraftPublishing(
        id,
        {
          baseSha: draft.baseSha ?? undefined,
          previewBranch: draft.previewBranch,
          pullRequestNumber: draft.pullRequestNumber ?? undefined,
          previewUrl,
          status: draft.status,
        },
        user.id
      );
    }

    return NextResponse.json({
      previewUrl: previewUrl ?? draft.previewUrl ?? null,
      pullRequestUrl,
      ready: Boolean(previewUrl ?? draft.previewUrl),
      lookupEnabled: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check preview status.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

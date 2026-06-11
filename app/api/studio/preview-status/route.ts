import { NextResponse } from "next/server";

import {
  hasPreviewLookup,
  getPreviewUrl,
  getPullRequestHeadSha,
  getPullRequestUrl,
} from "../../../../lib/studio/github";
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

    const previewCommitSha = draft.pullRequestNumber
      ? await getPullRequestHeadSha(draft.pullRequestNumber)
      : undefined;
    const preview = await getPreviewUrl(draft.previewBranch, previewCommitSha);
    if (preview.url && preview.url !== draft.previewUrl) {
      await updateDraftPublishing(
        id,
        {
          baseSha: draft.baseSha ?? undefined,
          previewBranch: draft.previewBranch,
          pullRequestNumber: draft.pullRequestNumber ?? undefined,
          previewUrl: preview.url,
          status: draft.status,
        },
        user.id
      );
    }

    return NextResponse.json({
      previewUrl: preview.url ?? draft.previewUrl ?? null,
      pullRequestUrl,
      ready: preview.ready || Boolean(draft.previewUrl),
      lookupEnabled: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check preview status.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

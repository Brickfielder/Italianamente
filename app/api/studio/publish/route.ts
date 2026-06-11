import { NextResponse } from "next/server";

import { publishPreview } from "../../../../lib/studio/github";
import {
  getDraft,
  updateDraftPublishing,
} from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";

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

    const result = await publishPreview({
      pullRequestNumber: draft.pullRequestNumber,
      baseSha: draft.baseSha,
    });
    await updateDraftPublishing(id, { status: "published" }, user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish.";
    return NextResponse.json({ message }, { status: 400 });
  }
}


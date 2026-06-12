import { NextResponse } from "next/server";
import { z } from "zod";

import { hasDatabase } from "../../../../lib/db";
import { deleteStudioDocument } from "../../../../lib/studio/github";
import { deleteDraftByPath } from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";
import type { StudioDocument } from "../../../../lib/studio/types";

const deleteSchema = z.object({
  documentPath: z
    .string()
    .regex(/^content\/(culture|grammar|multimedia)\/[^/]+\.mdx$/),
  documentType: z.literal("post"),
  contentOrigin: z.enum(["repository", "new"]).optional(),
  title: z.string().min(1).max(200),
  previewBranch: z.string().optional(),
  pullRequestNumber: z.number().optional(),
});

export async function DELETE(request: Request) {
  try {
    const user = await requireStudioUser();
    const document = deleteSchema.parse(
      await request.json()
    ) as StudioDocument;

    if (document.contentOrigin !== "new") {
      await deleteStudioDocument(document);
    }
    if (hasDatabase()) {
      await deleteDraftByPath(document.documentPath, user.id);
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete article.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

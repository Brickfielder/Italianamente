import { NextResponse } from "next/server";
import { z } from "zod";

import { saveDraft } from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";

const documentSchema = z.object({
  id: z.string().uuid().optional(),
  documentPath: z.string().startsWith("content/").endsWith(".mdx"),
  documentType: z.enum(["post", "page", "home"]),
  contentOrigin: z.enum(["repository", "new"]).optional(),
  title: z.string().min(1).max(200),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
  imageDisplayWidth: z.number().min(150).max(1200).optional(),
  status: z.enum(["published", "archived"]).optional(),
  body: z.string(),
  tiles: z.array(z.record(z.string(), z.unknown())).optional(),
  tilesLastUpdated: z.string().optional(),
  baseSha: z.string().optional(),
  previewBranch: z.string().optional(),
  pullRequestNumber: z.number().optional(),
  pullRequestUrl: z.string().url().optional(),
  previewUrl: z.string().url().nullable().optional(),
  draftStatus: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireStudioUser();
    const document = documentSchema.parse(await request.json());
    const saved = await saveDraft(document, user.id);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

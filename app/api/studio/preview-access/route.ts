import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createPreviewShareUrl,
  getPreviewUrl,
  getPullRequestHeadSha,
} from "../../../../lib/studio/github";
import { getDraft } from "../../../../lib/studio/repository";
import { requireStudioUser } from "../../../../lib/studio/session";
import type { StudioDocument } from "../../../../lib/studio/types";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request) {
  try {
    await requireStudioUser();
  } catch {
    return NextResponse.redirect(new URL("/studio", request.url), { headers });
  }

  try {
    const id = z.string().uuid().parse(new URL(request.url).searchParams.get("id"));
    const draft = await getDraft(id);
    if (!draft?.previewBranch || !draft.pullRequestNumber) {
      return new NextResponse("Crea una nuova anteprima da Studio prima di aprirla.", {
        status: 409,
        headers,
      });
    }
    const sha = await getPullRequestHeadSha(draft.pullRequestNumber);
    const preview = await getPreviewUrl(draft.previewBranch, sha);
    if (!preview.ready || !preview.url || !preview.deploymentId) {
      return new NextResponse("Anteprima in preparazione. Torna a Studio e riprova tra poco.", {
        status: 409,
        headers,
      });
    }
    const url = await createPreviewShareUrl(preview.deploymentId, {
      ...(draft.payload as StudioDocument),
      documentPath: draft.documentPath,
      documentType: draft.documentType as StudioDocument["documentType"],
      previewUrl: preview.url,
    });
    return NextResponse.redirect(url, { headers });
  } catch {
    return new NextResponse("Non è stato possibile aprire l'anteprima. Torna a Studio e riprova.", {
      status: 400,
      headers,
    });
  }
}

import "server-only";

import { marked } from "marked";

import { getPage, listPosts } from "../content";
import { hasDatabase } from "../db";
import { publishedHtmlToEditorHtml } from "./embeds";
import { listDrafts } from "./repository";
import type { StudioDocument } from "./types";

const markdownToHtml = async (source: string) =>
  publishedHtmlToEditorHtml(String(await marked.parse(source, { gfm: true })));

export async function loadStudioDocuments(): Promise<StudioDocument[]> {
  const [posts, home, about] = await Promise.all([
    listPosts({ includeArchived: true }),
    getPage("home"),
    getPage("about"),
  ]);

  const documents: StudioDocument[] = await Promise.all(
    posts.map(async (post) => ({
      documentPath: `content/${post._sys.relativePath}`,
      documentType: "post" as const,
      contentOrigin: "repository" as const,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
      image: post.image,
      imageWidth: post.imageWidth,
      imageHeight: post.imageHeight,
      imageDisplayWidth: post.imageDisplayWidth,
      status: post.status,
      body: await markdownToHtml(post.body),
    }))
  );

  if (home) {
    documents.unshift({
      documentPath: "content/page/home.mdx",
      documentType: "home",
      contentOrigin: "repository",
      title: home.title,
      body: await markdownToHtml(home.body),
      tilesLastUpdated: home.tilesLastUpdated,
      tiles: home.tiles?.map((tile) => ({
        style: tile.style,
        category: tile.category,
        title: tile.title,
        postReference: tile.postReference,
        description: tile.description,
        bulletPoints: tile.bulletPoints,
        buttonText: tile.buttonText,
      })),
    });
  }

  if (about) {
    documents.splice(1, 0, {
      documentPath: "content/page/about.mdx",
      documentType: "page",
      contentOrigin: "repository",
      title: about.title,
      body: await markdownToHtml(about.body),
    });
  }

  if (!hasDatabase()) {
    return documents;
  }

  const savedDrafts = await listDrafts();
  const byPath = new Map(documents.map((document) => [document.documentPath, document]));

  for (const draft of savedDrafts) {
    const payload = draft.payload as StudioDocument;
    const repositoryDocument = byPath.get(draft.documentPath);
    byPath.set(draft.documentPath, {
      ...repositoryDocument,
      ...payload,
      contentOrigin:
        payload.contentOrigin ??
        (repositoryDocument ? "repository" : "new"),
      id: draft.id,
      baseSha: draft.baseSha ?? undefined,
      previewBranch: draft.previewBranch ?? undefined,
      pullRequestNumber: draft.pullRequestNumber ?? undefined,
      previewUrl: draft.previewUrl ?? undefined,
      draftStatus: draft.status,
    } as StudioDocument);
  }

  return Array.from(byPath.values());
}

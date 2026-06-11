import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { PageDocument, PostDocument } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const POST_FOLDERS = new Set(["grammar", "culture", "multimedia"]);

const safeContentPath = (relativePath: string) => {
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, "/"));

  if (
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error("Invalid content path.");
  }

  return path.join(CONTENT_ROOT, normalized);
};

const systemInfo = (relativePath: string) => {
  const withoutExtension = relativePath.replace(/\.mdx$/, "");
  const breadcrumbs = withoutExtension.split("/");

  return {
    filename: breadcrumbs.at(-1) ?? withoutExtension,
    breadcrumbs,
    relativePath,
  };
};

const numberOrUndefined = (value: unknown) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  return typeof numeric === "number" && Number.isFinite(numeric)
    ? numeric
    : undefined;
};

export async function getPost(relativePath: string): Promise<PostDocument | null> {
  const normalized = relativePath.replace(/^content\//, "");
  const folder = normalized.split("/")[0];

  if (!POST_FOLDERS.has(folder) || !normalized.endsWith(".mdx")) {
    return null;
  }

  try {
    const raw = await fs.readFile(safeContentPath(normalized), "utf8");
    const parsed = matter(raw);

    return {
      title: String(parsed.data.title ?? ""),
      excerpt:
        typeof parsed.data.excerpt === "string"
          ? parsed.data.excerpt
          : undefined,
      category: String(parsed.data.category ?? ""),
      tags: Array.isArray(parsed.data.tags)
        ? parsed.data.tags.map(String)
        : [],
      image:
        typeof parsed.data.image === "string" ? parsed.data.image : undefined,
      imageWidth: numberOrUndefined(parsed.data.imageWidth),
      imageHeight: numberOrUndefined(parsed.data.imageHeight),
      imageDisplayWidth: numberOrUndefined(parsed.data.imageDisplayWidth),
      status: parsed.data.status === "archived" ? "archived" : "published",
      body: parsed.content.trim(),
      _sys: systemInfo(normalized),
    };
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function listPosts(options?: {
  includeArchived?: boolean;
}): Promise<PostDocument[]> {
  const posts = await Promise.all(
    Array.from(POST_FOLDERS).map(async (folder) => {
      const folderPath = safeContentPath(folder);
      const entries = await fs.readdir(folderPath, { withFileTypes: true });

      return Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
          .map((entry) => getPost(`${folder}/${entry.name}`))
      );
    })
  );

  return posts
    .flat()
    .filter((post): post is PostDocument => Boolean(post))
    .filter((post) => options?.includeArchived || post.status !== "archived")
    .sort((a, b) => a.title.localeCompare(b.title, "it"));
}

export async function getPage(filename: string): Promise<PageDocument | null> {
  const relativePath = `page/${filename.replace(/\.mdx$/, "")}.mdx`;

  try {
    const raw = await fs.readFile(safeContentPath(relativePath), "utf8");
    const parsed = matter(raw);
    const tiles = Array.isArray(parsed.data.tiles)
      ? await Promise.all(
          parsed.data.tiles.map(async (tile) => {
            const postReference =
              typeof tile?.postReference === "string"
                ? tile.postReference
                : undefined;

            return {
              ...tile,
              postReference,
              referencedPost: postReference
                ? await getPost(postReference)
                : null,
            };
          })
        )
      : undefined;

    return {
      title: String(parsed.data.title ?? ""),
      tilesLastUpdated:
        typeof parsed.data.tilesLastUpdated === "string"
          ? parsed.data.tilesLastUpdated
          : undefined,
      tiles,
      body: parsed.content.trim(),
      _sys: systemInfo(relativePath),
    };
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export const contentPathFromSlug = (segments: string[]) =>
  `${segments.join("/")}.mdx`;

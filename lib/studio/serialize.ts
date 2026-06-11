import matter from "gray-matter";

import { sanitizeEditorHtml } from "../content/sanitize";
import { editorHtmlToPublishedHtml } from "./embeds";
import type { StudioDocument } from "./types";

const cleanTile = (tile: NonNullable<StudioDocument["tiles"]>[number]) => ({
  ...(tile.style ? { style: tile.style } : {}),
  ...(tile.category ? { category: tile.category } : {}),
  ...(tile.title ? { title: tile.title } : {}),
  ...(tile.postReference ? { postReference: tile.postReference } : {}),
  ...(tile.description ? { description: tile.description } : {}),
  ...(tile.bulletPoints?.length ? { bulletPoints: tile.bulletPoints } : {}),
  ...(tile.buttonText ? { buttonText: tile.buttonText } : {}),
});

export function serializeStudioDocument(document: StudioDocument) {
  const frontmatter: Record<string, unknown> = {
    title: document.title.trim(),
  };

  if (document.documentType === "post") {
    if (document.excerpt?.trim()) {
      frontmatter.excerpt = document.excerpt.trim();
    }
    frontmatter.category = document.category?.trim() || "Curiosità";
    if (document.tags?.length) {
      frontmatter.tags = document.tags.filter(Boolean);
    }
    if (document.image) {
      frontmatter.image = document.image;
    }
    if (document.imageWidth) {
      frontmatter.imageWidth = document.imageWidth;
    }
    if (document.imageHeight) {
      frontmatter.imageHeight = document.imageHeight;
    }
    if (document.imageDisplayWidth) {
      frontmatter.imageDisplayWidth = document.imageDisplayWidth;
    }
    if (document.status === "archived") {
      frontmatter.status = "archived";
    }
  }

  if (document.documentType === "home") {
    frontmatter.tilesLastUpdated = new Date().toISOString();
    frontmatter.tiles = document.tiles?.map(cleanTile) ?? [];
  }

  const body = sanitizeEditorHtml(
    editorHtmlToPublishedHtml(document.body || "")
  );
  return matter.stringify(body ? `${body}\n` : "", frontmatter);
}

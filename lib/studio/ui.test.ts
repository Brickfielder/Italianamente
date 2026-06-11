import { describe, expect, it } from "vitest";

import type { StudioDocument } from "./types";
import {
  filterStudioPosts,
  mergeStudioDocument,
  publishingLabels,
  seedTileFromPost,
} from "./ui";

const post: StudioDocument = {
  documentPath: "content/culture/felicita.mdx",
  documentType: "post",
  contentOrigin: "repository",
  title: "La felicità",
  excerpt: "Una giornata speciale",
  category: "Curiosità",
  tags: ["primavera"],
  body: "<p>Testo</p>",
};

describe("studio UI helpers", () => {
  it("filters articles by normalized text and category", () => {
    expect(filterStudioPosts([post], "felicita", "Curiosità")).toEqual([post]);
    expect(filterStudioPosts([post], "primavera", "Film")).toEqual([]);
  });

  it("seeds only empty card fields from an article", () => {
    expect(
      seedTileFromPost(
        { title: "Titolo personalizzato", description: "" },
        post
      )
    ).toMatchObject({
      title: "Titolo personalizzato",
      category: "Curiosità",
      description: "Una giornata speciale",
    });
    expect(seedTileFromPost({ title: "Nuova card" }, post).title).toBe(
      "La felicità"
    );
  });

  it("distinguishes publishing a new article from updating one", () => {
    expect(
      publishingLabels({ ...post, contentOrigin: "new" }).action
    ).toBe("Pubblica nuovo articolo");
    expect(publishingLabels(post).action).toBe("Aggiorna articolo");
  });

  it("preserves preview metadata when a stale save response arrives", () => {
    expect(
      mergeStudioDocument(
        {
          ...post,
          id: "5d14ad32-7e9c-4be2-9f9b-5f6e8ad1b9ce",
          baseSha: "abc123",
          previewBranch: "studio/content-culture-felicita",
          pullRequestNumber: 42,
          pullRequestUrl:
            "https://github.com/Brickfielder/Italianamente/pull/42",
          previewUrl: "https://italianamente-git-studio-test.vercel.app",
          draftStatus: "preview",
        },
        {
          ...post,
          body: "<p>Testo aggiornato</p>",
        }
      )
    ).toMatchObject({
      body: "<p>Testo aggiornato</p>",
      previewBranch: "studio/content-culture-felicita",
      pullRequestNumber: 42,
      pullRequestUrl:
        "https://github.com/Brickfielder/Italianamente/pull/42",
      previewUrl: "https://italianamente-git-studio-test.vercel.app",
      draftStatus: "preview",
    });
  });

  it("allows explicit preview url clearing", () => {
    expect(
      mergeStudioDocument(
        {
          ...post,
          previewUrl: "https://italianamente-git-studio-test.vercel.app",
        },
        { ...post, previewUrl: null }
      ).previewUrl
    ).toBeNull();
  });
});

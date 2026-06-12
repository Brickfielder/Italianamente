import { describe, expect, it } from "vitest";

import type { StudioDocument } from "./types";
import {
  applyStudioPatch,
  createHomeTileForPost,
  filterStudioPosts,
  mergeStudioDocument,
  publishingLabels,
  seedTileFromPost,
} from "./ui";
import { selectPreviewDeployment } from "./github";

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

  it("creates a homepage card linked to its full article", () => {
    expect(createHomeTileForPost(post)).toMatchObject({
      title: "La felicità",
      category: "Curiosità",
      description: "Una giornata speciale",
      postReference: "content/culture/felicita.mdx",
      buttonText: "Leggi l'articolo",
    });
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

  it("clears stale preview metadata after a real content edit", () => {
    expect(
      applyStudioPatch(
        {
          ...post,
          baseSha: "abc123",
          previewBranch: "studio/content-culture-felicita",
          pullRequestNumber: 42,
          pullRequestUrl:
            "https://github.com/Brickfielder/Italianamente/pull/42",
          previewUrl: "https://ready-preview.vercel.app",
          draftStatus: "published",
        },
        { title: "Titolo aggiornato" }
      )
    ).toMatchObject({
      title: "Titolo aggiornato",
      draftStatus: "draft",
    });
  });

  it("keeps preview metadata for non-content bookkeeping updates", () => {
    expect(
      applyStudioPatch(
        {
          ...post,
          baseSha: "abc123",
          previewBranch: "studio/content-culture-felicita",
          pullRequestNumber: 42,
          pullRequestUrl:
            "https://github.com/Brickfielder/Italianamente/pull/42",
          previewUrl: "https://ready-preview.vercel.app",
          draftStatus: "preview",
        },
        { contentOrigin: "repository" }
      )
    ).toMatchObject({
      previewBranch: "studio/content-culture-felicita",
      pullRequestNumber: 42,
      previewUrl: "https://ready-preview.vercel.app",
      draftStatus: "preview",
    });
  });

  it("finds the latest GitHub preview deployment and waits for READY", () => {
    expect(
      selectPreviewDeployment(
        [
          {
            createdAt: 10,
            meta: { githubCommitRef: "studio/content-page-home" },
            readyState: "BUILDING",
            url: "old-preview.vercel.app",
          },
          {
            createdAt: 20,
            meta: {
              githubCommitRef: "studio/content-page-home",
              githubCommitSha: "abc123",
            },
            readyState: "READY",
            url: "ready-preview.vercel.app",
          },
        ],
        "studio/content-page-home",
        "abc123"
      )
    ).toEqual({
      ready: true,
      url: "https://ready-preview.vercel.app",
    });
  });

  it("keeps polling when the matching deployment is not ready yet", () => {
    expect(
      selectPreviewDeployment(
        [
          {
            createdAt: 20,
            meta: {
              githubCommitRef: "studio/content-page-home",
              githubCommitSha: "abc123",
            },
            readyState: "BUILDING",
            url: "building-preview.vercel.app",
          },
        ],
        "studio/content-page-home",
        "abc123"
      )
    ).toEqual({
      ready: false,
      url: null,
    });
  });

  it("ignores an older ready deployment from the same branch", () => {
    expect(
      selectPreviewDeployment(
        [
          {
            createdAt: 10,
            meta: {
              githubCommitRef: "studio/content-page-home",
              githubCommitSha: "oldsha",
            },
            readyState: "READY",
            url: "old-preview.vercel.app",
          },
          {
            createdAt: 20,
            meta: {
              githubCommitRef: "studio/content-page-home",
              githubCommitSha: "newsha",
            },
            readyState: "BUILDING",
            url: "new-preview.vercel.app",
          },
        ],
        "studio/content-page-home",
        "newsha"
      )
    ).toEqual({
      ready: false,
      url: null,
    });
  });
});

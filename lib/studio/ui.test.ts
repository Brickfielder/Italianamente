import { describe, expect, it } from "vitest";

import type { StudioDocument } from "./types";
import {
  filterStudioPosts,
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
});

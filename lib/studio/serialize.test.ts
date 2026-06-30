import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { sanitizeEditorHtml } from "../content/sanitize";
import {
  editorHtmlToPublishedHtml,
  normalizeEmbedUrl,
  publishedHtmlToEditorHtml,
} from "./embeds";
import { removeHomeReferences } from "./github";
import { serializeStudioDocument } from "./serialize";

describe("studio embeds", () => {
  it("normalizes common YouTube URL formats", () => {
    expect(
      normalizeEmbedUrl("https://www.youtube.com/watch?v=abc123")
    ).toBe("https://www.youtube.com/embed/abc123");
    expect(normalizeEmbedUrl("https://youtu.be/abc123?t=4")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
    expect(normalizeEmbedUrl("https://youtube.com/shorts/abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("uses placeholders only in the editable document", () => {
    const published =
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>';
    const editable = publishedHtmlToEditorHtml(published);

    expect(editable).toContain("studio-video-placeholder");
    expect(editable).not.toContain("<iframe");
    expect(editorHtmlToPublishedHtml(editable)).toContain("<iframe");
    expect(editorHtmlToPublishedHtml(editable)).toContain("studio-embed-frame");
  });

  it("automatically embeds standalone video links", () => {
    const linked =
      '<p><a href="https://www.youtube.com/watch?v=-aXNN46j7Qc">https://www.youtube.com/watch?v=-aXNN46j7Qc</a></p>';
    const editable = publishedHtmlToEditorHtml(linked);
    const published = editorHtmlToPublishedHtml(linked);

    expect(editable).toContain("studio-video-placeholder");
    expect(editable).toContain("youtube.com/embed/-aXNN46j7Qc");
    expect(published).toContain("<iframe");
    expect(published).toContain("studio-embed-frame");
    expect(published).toContain("youtube.com/embed/-aXNN46j7Qc");
    expect(published).toContain("Apri contenuto multimediale");
    expect(published).not.toContain("youtube.com/watch?v=");
  });

  it("leaves ordinary standalone links unchanged", () => {
    const linked =
      '<p><a href="https://example.com/article">Article</a></p>';

    expect(editorHtmlToPublishedHtml(linked)).toBe(linked);
    expect(publishedHtmlToEditorHtml(linked)).toBe(linked);
  });

  it("rejects unsupported video providers", () => {
    expect(() => normalizeEmbedUrl("https://example.com/video")).toThrow();
  });
});

describe("sanitizeEditorHtml", () => {
  it("keeps supported rich content and removes executable markup", () => {
    const result = sanitizeEditorHtml(
      '<h2>Titolo</h2><script>alert(1)</script><a href="javascript:alert(1)">Bad</a><strong>Testo</strong>'
    );

    expect(result).toContain("<h2>Titolo</h2>");
    expect(result).toContain("<strong>Testo</strong>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("javascript:");
  });

  it("allows known embeds and removes unknown iframe sources", () => {
    const result = sanitizeEditorHtml(
      '<iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="https://example.com/embed"></iframe>'
    );

    expect(result).toContain("youtube.com/embed/abc");
    expect(result).not.toContain("example.com/embed");
  });

  it("allows uploaded video and audio files", () => {
    const result = sanitizeEditorHtml(
      '<video src="https://example.public.blob.vercel-storage.com/movie.mp4" controls></video><audio src="https://example.public.blob.vercel-storage.com/audio.mp3" controls></audio>'
    );

    expect(result).toContain("<video");
    expect(result).toContain("movie.mp4");
    expect(result).toContain("<audio");
    expect(result).toContain("audio.mp3");
  });

  it("preserves supported font and text color formatting", () => {
    const result = sanitizeEditorHtml(
      '<font face="Georgia" color="#b23a3a" size="5">Testo</font><span style="position: fixed; color: #123456; font-size: 18px">Altro</span>'
    );

    expect(result).toContain("font-family:Georgia");
    expect(result).toContain("color:#b23a3a");
    expect(result).toContain("font-size:24px");
    expect(result).toContain("color:#123456");
    expect(result).toContain("font-size:18px");
    expect(result).not.toContain("position");
    expect(result).not.toContain("<font");
  });

  it("preserves safe text justification and removes unrelated block styles", () => {
    const result = sanitizeEditorHtml(
      '<p style="text-align: justify; position: fixed">Testo</p><div style="text-align: left">Altro</div>'
    );

    expect(result).toContain("text-align:justify");
    expect(result).toContain("text-align:left");
    expect(result).not.toContain("position");
  });

  it("converts editor video placeholders into published iframes", () => {
    const result = sanitizeEditorHtml(
      '<div class="studio-video-placeholder" data-embed-url="https://www.youtube.com/embed/abc"><strong>Video incorporato</strong></div>'
    );

    expect(result).toContain("<iframe");
    expect(result).toContain("https://www.youtube.com/embed/abc");
    expect(result).not.toContain("studio-video-placeholder");
  });

  it("removes empty editor markup that breaks MDX but keeps media", () => {
    const result = sanitizeEditorHtml(
      '<p><span>Testo</span></p><p>\n\n\n</p><p><span></span></p><p><span><img src="https://example.public.blob.vercel-storage.com/foto.jpg" alt="" /></span></p><p><br /></p><p>Fine</p>'
    );

    expect(result).toContain("<p><span>Testo</span></p>");
    expect(result).toContain("foto.jpg");
    expect(result).toContain("<p>Fine</p>");
    expect(result).not.toContain("<p>\n");
    expect(result).not.toContain("<span></span>");
    expect(result).not.toContain("<p><br /></p>");
  });
});

describe("serializeStudioDocument", () => {
  it("serializes a post with frontmatter and sanitized HTML", () => {
    const output = serializeStudioDocument({
      documentPath: "content/culture/example.mdx",
      documentType: "post",
      title: "Titolo",
      excerpt: "Una breve introduzione all'articolo.",
      category: "Curiosità",
      tags: ["Italia"],
      status: "archived",
      image: "/uploads/example.jpg",
      imageWidth: 1200,
      imageHeight: 800,
      imageDisplayWidth: 420,
      body: "<p>Ciao <strong>mondo</strong></p><script>bad()</script>",
    });
    const parsed = matter(output);

    expect(parsed.data).toMatchObject({
      title: "Titolo",
      excerpt: "Una breve introduzione all'articolo.",
      category: "Curiosità",
      tags: ["Italia"],
      status: "archived",
      imageDisplayWidth: 420,
    });
    expect(parsed.content).toContain("<strong>mondo</strong>");
    expect(parsed.content).not.toContain("<script");
  });

  it("serializes homepage tiles without resolved post data", () => {
    const output = serializeStudioDocument({
      documentPath: "content/page/home.mdx",
      documentType: "home",
      title: "Home Page",
      body: "",
      tiles: [
        {
          style: "standard",
          title: "Una card",
          postReference: "content/culture/example.mdx",
          referencedPost: null,
        },
      ],
    });
    const parsed = matter(output);

    expect(parsed.data.tiles).toEqual([
      {
        style: "standard",
        title: "Una card",
        postReference: "content/culture/example.mdx",
      },
    ]);
    expect(parsed.data.tilesLastUpdated).toBeTypeOf("string");
  });
});

describe("removeHomeReferences", () => {
  it("removes homepage cards linked to a deleted article", () => {
    const source = `---
title: Home Page
tiles:
  - title: Keep
    postReference: content/culture/keep.mdx
  - title: Delete
    postReference: content/culture/delete.mdx
---
`;

    const output = removeHomeReferences(
      source,
      "content/culture/delete.mdx"
    );

    expect(output).toContain("content/culture/keep.mdx");
    expect(output).not.toContain("content/culture/delete.mdx");
  });
});

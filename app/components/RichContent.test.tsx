import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import remarkGfm from "remark-gfm";

import { prepareMdxSource, richContentComponents } from "./RichContent";

it("renders the published language-week article", async () => {
  const { content: source } = matter(
    fs.readFileSync(
      path.join(process.cwd(), "content/culture/bozza-1792521262293.mdx"),
      "utf8"
    )
  );
  const { content } = await compileMDX({
    source: prepareMdxSource(source),
    components: richContentComponents,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });
  const html = renderToStaticMarkup(content);
  expect(html).toContain("L’italiano non è");
  expect(html).toContain("Conferenze e simposi");
  expect(html).toContain('href="https://www.fattinostri.it/');
});

it.each(["\n\n", "\r\n \t\r\n"])(
  "normalizes blank lines inside HTML paragraphs (%j) without changing Markdown blocks",
  async (blankLine) => {
    const source = `<p>Prima</p><p>${blankLine}<span>Ultima</span></p>\n\nPrimo\n\nSecondo`;
    const prepared = prepareMdxSource(source);
    expect(prepared).toContain("Primo\n\nSecondo");
    const { content } = await compileMDX({
      source: prepared,
      components: richContentComponents,
    });
    expect(renderToStaticMarkup(content)).toContain("<span>Ultima</span>");
  }
);

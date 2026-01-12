import { TinaMarkdown } from "tinacms/dist/rich-text";

import { client } from "../../tina/__generated__/client";

export default async function AboutPage() {
  const res = await client.queries.page({ relativePath: "about.mdx" });
  const page = res.data.page;

  return (
    <main className="container">
      <article className="tile">
        <div>
          <h3>{page.title}</h3>
          <div className="tile-content">
            <TinaMarkdown content={page.body} />
          </div>
        </div>
      </article>
    </main>
  );
}

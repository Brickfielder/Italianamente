import Image from "next/image";
import { notFound } from "next/navigation";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import { client } from "../../../tina/__generated__/client";

type PostPageProps = {
  params: { slug: string };
};

export default async function PostPage({ params }: PostPageProps) {
  try {
    const res = await client.queries.post({
      relativePath: `${params.slug}.md`,
    });
    const post = res.data.post;

    return (
      <main className="container">
        <article className="tile">
          <div>
            <span className="tile-category">{post.category}</span>
            <h3>{post.title}</h3>
            {post.image && (
              <div style={{ marginBottom: "20px" }}>
                <Image
                  src={post.image}
                  alt={post.title}
                  width={800}
                  height={450}
                  style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                />
              </div>
            )}
            <div className="tile-content">
              <TinaMarkdown content={post.body} />
            </div>
          </div>
        </article>
      </main>
    );
  } catch (error) {
    notFound();
  }
}

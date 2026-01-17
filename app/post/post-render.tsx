import Image from "next/image";
import { notFound } from "next/navigation";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import { client } from "../../tina/__generated__/client";
import ScrollToTop from "./[...slug]/scroll-to-top";

export async function renderPostByPath(relativePath: string) {
  try {
    const res = await client.queries.post({
      relativePath,
    });

    const post = res.data.post;
    const tags = (post as { tags?: string[] }).tags;

    return (
      <main className="container">
        <ScrollToTop />
        <article className="tile">
          <div>
            <span className="tile-category">{post.category}</span>
            {tags && tags.length > 0 && (
              <div className="post-tags">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            )}
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
    console.error("Error fetching post:", error);
    notFound();
  }
}

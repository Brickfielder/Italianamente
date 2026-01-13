import Image from "next/image";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import ScrollToTop from "./scroll-to-top";

type PostTemplateData = {
  title: string;
  category?: string | null;
  tags?: string[] | null;
  image?: string | null;
  body?: unknown;
};

type PostTemplateProps = {
  post: PostTemplateData;
};

export default function PostTemplate({ post }: PostTemplateProps) {
  const tags = post.tags ?? [];

  return (
    <main className="container">
      <ScrollToTop />
      <article className="tile">
        <div>
          {post.category && (
            <span className="tile-category">{post.category}</span>
          )}
          {tags.length > 0 && (
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
}

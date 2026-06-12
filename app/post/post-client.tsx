import Image from "next/image";

import {
  isRemoteImageSrc,
  normalizeImageSrc,
} from "../../lib/content/images";
import type { PostDocument } from "../../lib/content/types";
import RichContent from "../components/RichContent";
import ScrollToTop from "./[...slug]/scroll-to-top";

export default function PostClient({ post }: { post: PostDocument }) {
  const imageSrc = normalizeImageSrc(post.image);

  return (
    <main className="container container--single">
      <ScrollToTop />
      <article className="tile" lang="it">
        <div>
          <span className="tile-category">{post.category}</span>
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3>{post.title}</h3>
          {imageSrc && (
            <div
              className="post-cover-image"
              style={{
                maxWidth: `${
                  post.imageDisplayWidth ?? post.imageWidth ?? 1200
                }px`,
              }}
            >
              <Image
                src={imageSrc}
                alt={post.title}
                width={post.imageWidth ?? 800}
                height={post.imageHeight ?? 450}
                sizes="100vw"
                className="content-image"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                unoptimized={isRemoteImageSrc(imageSrc)}
              />
            </div>
          )}
          <div className="tile-content post-content">
            <RichContent source={post.body} />
          </div>
        </div>
      </article>
    </main>
  );
}

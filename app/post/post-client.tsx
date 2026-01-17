"use client";

import Image from "next/image";
import { tinaField, useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import ScrollToTop from "./[...slug]/scroll-to-top";

export default function PostClient(props) {
  const { data } = useTina(props);
  const post = data?.post;
  const tags = post?.tags;
  const spacerClassMap = {
    sm: "post-spacer--sm",
    md: "post-spacer--md",
    lg: "post-spacer--lg",
  };

  const Spacer = ({ size, data: spacerData }) => {
    const spacerSize = size ?? spacerData?.size ?? "md";
    const spacerClass = spacerClassMap[spacerSize] ?? spacerClassMap.md;

    return <div className={`post-spacer ${spacerClass}`} aria-hidden="true" />;
  };

  return (
    <main className="container">
      <ScrollToTop />
      <article className="tile" lang="it">
        <div>
          <span className="tile-category" data-tina-field={tinaField(post, "category")}>
            {post?.category}
          </span>
          {tags && tags.length > 0 && (
            <div className="post-tags">
              {tags.map((tag, index) => (
                <span key={tag} className="tag-pill" data-tina-field={tinaField(post, "tags", index)}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 data-tina-field={tinaField(post, "title")}>{post?.title}</h3>
          {post?.image && (
            <div style={{ marginBottom: "20px" }}>
              <Image
                src={post.image}
                alt={post.title}
                width={800}
                height={450}
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                data-tina-field={tinaField(post, "image")}
              />
            </div>
          )}
          <div className="tile-content post-content" data-tina-field={tinaField(post, "body")}>
            <TinaMarkdown content={post?.body} components={{ spacer: Spacer }} />
          </div>
        </div>
      </article>
    </main>
  );
}

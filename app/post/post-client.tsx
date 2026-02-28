"use client";

import Image from "next/image";
import { tinaField, useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

import ScrollToTop from "./[...slug]/scroll-to-top";
import ContentImage from "../components/ContentImage";

const normalizeImageSrc = (src?: string) => {
  if (!src) {
    return src;
  }

  if (src.startsWith("http") || src.startsWith("data:")) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
};

export default function PostClient(props) {
  const { data } = useTina(props);
  const post = data?.post;
  const tags = post?.tags;
  const spacerClassMap = {
    sm: "post-spacer--sm",
    md: "post-spacer--md",
    lg: "post-spacer--lg",
  };
  const imageWidth = Number.isFinite(post?.imageWidth) ? post.imageWidth : 800;
  const imageHeight = Number.isFinite(post?.imageHeight) ? post.imageHeight : 450;

  const Spacer = ({ size, data: spacerData }) => {
    const spacerSize = size ?? spacerData?.size ?? "md";
    const spacerClass = spacerClassMap[spacerSize] ?? spacerClassMap.md;

    return <div className={`post-spacer ${spacerClass}`} aria-hidden="true" />;
  };

  const imageSrc = normalizeImageSrc(post?.image);

  return (
    <main className="container container--single">
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
          {imageSrc && (
            <div style={{ marginBottom: "20px" }}>
              <Image
                src={imageSrc}
                alt={post.title}
                width={imageWidth}
                height={imageHeight}
                sizes="100vw"
                className="content-image"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
                data-tina-field={tinaField(post, "image")}
              />
            </div>
          )}
          <div className="tile-content post-content" data-tina-field={tinaField(post, "body")}>
            <TinaMarkdown content={post?.body} components={{ spacer: Spacer, img: ContentImage }} />
          </div>
        </div>
      </article>
    </main>
  );
}

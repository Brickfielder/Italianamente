"use client";

import Link from "next/link";
import { tinaField, useTina } from "tinacms/dist/react";

export default function ClientHomePage(props) {
  const { data } = useTina(props);
  const page = data?.page;

  return (
    <main className="container">
      {page?.tiles?.map((tile, i) => {
        const referencedPost = tile?.postReference;

        const displayCategory = tile?.category || referencedPost?.category;
        const displayTitle = tile?.title || referencedPost?.title;

        const relativePath = referencedPost?._sys?.relativePath;
        const breadcrumbs = referencedPost?._sys?.breadcrumbs;
        const filename = referencedPost?._sys?.filename;
        const slug = relativePath
          ? relativePath.replace(/\.mdx$/, "")
          : breadcrumbs && breadcrumbs.length > 0
          ? breadcrumbs.join("/")
          : filename
          ? filename.replace(/\.mdx$/, "")
          : null;
        const postHref = slug ? `/${slug}` : null;

        const tileClasses = `tile ${tile?.style === "idiom" ? "idiom" : ""} ${tile?.style === "joke" ? "joke" : ""}`;

        const TileContent = (
          <article className={tileClasses}>
            <div>
              {displayCategory && (
                <span className="tile-category" data-tina-field={tinaField(tile, "category")}>
                  {displayCategory}
                </span>
              )}
              {displayTitle && <h3 data-tina-field={tinaField(tile, "title")}>{displayTitle}</h3>}

              <div className="tile-content">
                {tile?.description && (
                  <p style={{ marginBottom: "10px" }} data-tina-field={tinaField(tile, "description")}>
                    {tile.description}
                  </p>
                )}

                {tile?.bulletPoints && tile.bulletPoints.length > 0 && (
                  <ul>
                    {tile.bulletPoints.map((point, index) => (
                      <li key={index} data-tina-field={tinaField(tile, "bulletPoints", index)}>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="read-more" data-tina-field={tinaField(tile, "buttonText")}>
              {tile?.buttonText || (postHref ? "Leggi l'articolo →" : "")}
            </div>
          </article>
        );

        if (referencedPost && postHref) {
          return (
            <Link key={i} href={postHref} className="tile-link">
              {TileContent}
            </Link>
          );
        }

        return (
          <div key={i} className="tile-link">
            {TileContent}
          </div>
        );
      })}
    </main>
  );
}

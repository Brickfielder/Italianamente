import Link from "next/link";

import type { PageDocument } from "../lib/content/types";

export default function ClientHomePage({ page }: { page: PageDocument }) {
  const lastUpdatedSource = page.tilesLastUpdated ?? null;
  const lastUpdatedLabel = lastUpdatedSource
    ? new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(lastUpdatedSource))
    : null;

  return (
    <main className="container">
      {lastUpdatedLabel && (
        <p className="home-metadata">
          Ultimo aggiornamento:{" "}
          <time dateTime={lastUpdatedSource ?? undefined}>{lastUpdatedLabel}</time>
        </p>
      )}
      {page.tiles?.map((tile, index) => {
        const referencedPost = tile.referencedPost;
        const displayCategory = tile.category || referencedPost?.category;
        const displayTitle = tile.title || referencedPost?.title;
        const slug = referencedPost?._sys.relativePath.replace(/\.mdx$/, "");
        const postHref = slug ? `/${slug}` : null;
        const tileClasses = `tile ${
          tile.style === "idiom" ? "idiom" : ""
        } ${tile.style === "joke" ? "joke" : ""}`;

        const tileContent = (
          <article className={tileClasses}>
            <div>
              {displayCategory && (
                <span className="tile-category">{displayCategory}</span>
              )}
              {displayTitle && <h3>{displayTitle}</h3>}
              <div className="tile-content">
                {tile.description && (
                  <p style={{ marginBottom: "10px" }}>{tile.description}</p>
                )}
                {tile.bulletPoints && tile.bulletPoints.length > 0 && (
                  <ul>
                    {tile.bulletPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="read-more home-card-cta">
              {tile.buttonText || (postHref ? "Leggi l'articolo" : "")}
            </div>
          </article>
        );

        return referencedPost && postHref ? (
          <Link key={postHref} href={postHref} className="tile-link">
            {tileContent}
          </Link>
        ) : (
          <div key={`${displayTitle}-${index}`} className="tile-link">
            {tileContent}
          </div>
        );
      })}
    </main>
  );
}

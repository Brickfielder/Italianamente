import Link from "next/link";

import type { PageDocument } from "../../lib/content/types";
import RichContent from "../components/RichContent";

export default function ClientPage({ page }: { page: PageDocument }) {
  const tiles = page.tiles ?? [];

  return (
    <div className="page-wrapper">
      <main className="container">
        {page.title && tiles.length === 0 && (
          <article className="tile">
            <div>
              <h3>{page.title}</h3>
              {page.body && (
                <div className="tile-content post-content">
                  <RichContent source={page.body} />
                </div>
              )}
            </div>
          </article>
        )}

        {tiles.map((tile, index) => {
          const slug = tile.referencedPost?._sys.relativePath.replace(
            /\.mdx$/,
            ""
          );
          const card = (
            <article
              className={`tile ${
                tile.style === "idiom" ? "idiom" : ""
              } ${tile.style === "joke" ? "joke" : ""}`}
            >
              <div>
                {tile.category && (
                  <span className="tile-category">{tile.category}</span>
                )}
                {tile.title && <h3>{tile.title}</h3>}
                <div className="tile-content">
                  {tile.bulletPoints && tile.bulletPoints.length > 0 ? (
                    <ul>
                      {tile.bulletPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{tile.description}</p>
                  )}
                </div>
              </div>
              {tile.buttonText && (
                <div className="read-more">{tile.buttonText}</div>
              )}
            </article>
          );

          return slug ? (
            <Link key={slug} href={`/${slug}`} className="tile-link">
              {card}
            </Link>
          ) : (
            <div key={`${tile.title}-${index}`} className="tile-link">
              {card}
            </div>
          );
        })}
      </main>
    </div>
  );
}

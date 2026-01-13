import Link from "next/link";
import { client } from "../tina/__generated__/client";

export default async function Home() {
  const res = await client.queries.page({
    relativePath: "home.mdx",
    query: `query HomePage($relativePath: String!) {
      page(relativePath: $relativePath) {
        tiles {
          style
          category
          title
          description
          bulletPoints
          buttonText
          postReference {
            __typename
            ... on Grammar {
              title
              category
              _sys {
                filename
              }
            }
            ... on Culture {
              title
              category
              _sys {
                filename
              }
            }
            ... on Multimedia {
              title
              category
              _sys {
                filename
              }
            }
          }
        }
      }
    }`,
  });
  
  const page = res.data.page;
  const collectionRouteMap: Record<string, string> = {
    Grammar: "grammar",
    Culture: "culture",
    Multimedia: "multimedia",
  };

  return (
    <main className="container">
      {page.tiles?.map((tile, i) => {
        // 1. Calcola i dati da mostrare (Override o Automatico)
        const referencedPost = tile?.postReference;

        // Usa il dato manuale SE esiste, altrimenti usa quello del post
        const displayCategory = tile?.category || referencedPost?.category;
        const displayTitle = tile?.title || referencedPost?.title;

        // Calcola l'URL
        const collectionSlug = referencedPost?.__typename
          ? collectionRouteMap[referencedPost.__typename]
          : null;
        const postHref =
          referencedPost?._sys?.filename && collectionSlug
            ? `/${collectionSlug}/${referencedPost._sys.filename}`
            : null;

        const tileClasses = `tile ${tile?.style === 'idiom' ? 'idiom' : ''} ${tile?.style === 'joke' ? 'joke' : ''}`;

        const TileContent = (
          <article className={tileClasses}>
            <div>
              {displayCategory && <span className="tile-category">{displayCategory}</span>}
              {displayTitle && <h3>{displayTitle}</h3>}

              <div className="tile-content">
                {tile?.description && <p style={{ marginBottom: "10px" }}>{tile.description}</p>}

                {tile?.bulletPoints && tile.bulletPoints.length > 0 && (
                  <ul>
                    {tile.bulletPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Mostra il bottone se c'è un link O se c'è del testo manuale */}
            <div className="read-more">
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

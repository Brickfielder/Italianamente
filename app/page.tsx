import Link from "next/link";
import { client } from "../tina/__generated__/client";

export default async function Home() {
  const res = await client.queries.page({
    relativePath: "home.mdx",
    query: `query HomePage($relativePath: String!) {
      page(relativePath: $relativePath) {
        title  
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
  
  // Mappa i nomi "tecnici" di Tina nei percorsi dell'URL (tutto minuscolo)
  const collectionRouteMap: Record<string, string> = {
    Grammar: "grammar",
    Culture: "culture",
    Multimedia: "multimedia",
  };

  return (
    <main className="container">
      
      {/* --- HO REINSERITO IL TITOLO QUI SOTTO --- */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>{page.title}</h1>
      </div>

      <div className="grid">
        {page.tiles?.map((tile, i) => {
          // 1. Calcola i dati da mostrare
          const referencedPost = tile?.postReference;

          // Override manuale
          const displayCategory = tile?.category || referencedPost?.category;
          const displayTitle = tile?.title || referencedPost?.title;

          // 2. Calcola l'URL in base al TIPO di post (Grammar/Culture/Multimedia)
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

              <div className="read-more">
                {tile?.buttonText || (postHref ? "Leggi l'articolo →" : "")}
              </div>
            </article>
          );

          // 3. Renderizza Link o Div
          if (referencedPost && postHref) {
            // Nota: ho aggiunto display: contents per non rompere la griglia CSS
            return (
              <Link key={i} href={postHref} className="tile-link" style={{ display: 'contents' }}>
                {TileContent}
              </Link>
            );
          }

          return (
            <div key={i} className="tile-link" style={{ display: 'contents' }}>
              {TileContent}
            </div>
          );
        })}
      </div>
    </main>
  );
}

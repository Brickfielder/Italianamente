import Link from "next/link";

import { client } from "../tina/__generated__/client";

export default async function Home() {
  // 1. Chiede a Tina i dati del file "home.mdx"
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
            ... on Post {
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

  return (
    <main className="container">
      
      {/* 2. Se non ci sono tiles, mostra un avviso gentile */}
      {(!page.tiles || page.tiles.length === 0) && (
        <div style={{ textAlign: "center", width: "100%", padding: "50px" }}>
          <h3>Nessun contenuto ancora...</h3>
          <p>Vai su /admin per aggiungere le tue prime card!</p>
        </div>
      )}

      {/* 3. CICLO: Per ogni "tile" che hai creato nel CMS, disegna una card */}
      {page.tiles?.map((tile, i) => {
        const referencedPost = tile?.postReference;
        const displayCategory = tile?.category ?? referencedPost?.category;
        const displayTitle = tile?.title ?? referencedPost?.title;
        const postHref = referencedPost?._sys?.filename
          ? `/posts/${referencedPost._sys.filename}`
          : null;

        return (
          <article 
            key={i} 
            className={`tile ${tile?.style === 'idiom' ? 'idiom' : ''} ${tile?.style === 'joke' ? 'joke' : ''}`}
          >
            <div>
              {/* Categoria (se c'è) */}
              {displayCategory && (
                <span className="tile-category">{displayCategory}</span>
              )}

              {/* Titolo */}
              {displayTitle && <h3>{displayTitle}</h3>}

              <div className="tile-content">
                {/* Descrizione (se c'è) */}
                {tile?.description && (
                  <p style={{ marginBottom: "10px" }}>{tile.description}</p>
                )}

                {/* Lista puntata (se c'è) */}
                {tile?.bulletPoints && tile.bulletPoints.length > 0 && (
                  <ul>
                    {tile.bulletPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Bottone/Link in basso (se c'è testo) */}
            {tile?.buttonText && (
              postHref ? (
                <Link className="read-more" href={postHref}>
                  {tile.buttonText}
                </Link>
              ) : (
                <div className="read-more">{tile.buttonText}</div>
              )
            )}
          </article>
        );
      })}

    </main>
  );
}

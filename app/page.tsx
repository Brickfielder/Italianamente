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
      
      {/* Intestazione della Home */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>{page.title}</h1>
      </div>

      <div className="grid">
        {page.tiles?.map((tile, i) => {
          // 1. Calcola i dati da mostrare (Override o Automatico)
          const referencedPost = tile?.postReference;
          
          // Usa il dato manuale SE esiste, altrimenti usa quello del post
          const displayCategory = tile?.category || referencedPost?.category;
          const displayTitle = tile?.title || referencedPost?.title;
          
          // Calcola l'URL
          const postHref = referencedPost?._sys?.filename
            ? `/post/${referencedPost._sys.filename}`
            : null;

          // 2. Costruiamo il contenuto della Card
          const CardContent = (
            <article 
              className={`tile ${tile?.style === 'idiom' ? 'idiom' : ''} ${tile?.style === 'joke' ? 'joke' : ''}`}
            >
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

          // 3. SE c'è un link, avvolgi tutta la card col Link. Altrimenti mostra solo la card.
          if (postHref) {
            return (
              <Link key={i} href={postHref} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                {CardContent}
              </Link>
            );
          }

          return <div key={i}>{CardContent}</div>;
        })}
      </div>
    </main>
  );
}
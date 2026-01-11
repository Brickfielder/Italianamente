import { client } from "../tina/__generated__/client";

export default async function Home() {
  // 1. Chiede a Tina i dati del file "home.mdx"
  const res = await client.queries.page({ relativePath: "home.mdx" });
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
      {page.tiles?.map((tile, i) => (
        <article 
          key={i} 
          className={`tile ${tile?.style === 'idiom' ? 'idiom' : ''} ${tile?.style === 'joke' ? 'joke' : ''}`}
        >
          <div>
            {/* Categoria (se c'è) */}
            {tile?.category && (
              <span className="tile-category">{tile.category}</span>
            )}

            {/* Titolo */}
            {tile?.title && <h3>{tile.title}</h3>}

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
            <div className="read-more">{tile.buttonText}</div>
          )}
        </article>
      ))}

    </main>
  );
}
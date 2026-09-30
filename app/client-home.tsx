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
    <main className="home-page">
      <section className="home-mission" aria-labelledby="home-mission-title">
        <div className="eyebrow">Benvenuti a ItalianaMente</div>
        <h1 id="home-mission-title">Impara la lingua,<br /><em>vivi la cultura.</em></h1>
        <p>
          Un luogo dove le regole incontrano le storie, la cultura e la vita
          quotidiana.
        </p>
        <div className="hero-decoration">
          <img src="/design/flower.png" alt="" width="69" height="89" />
          <a className="explore-button" href="#articoli">Comincia a esplorare ↗</a>
          <img src="/design/flower.png" alt="" width="69" height="89" />
        </div>
      </section>
        <nav className="home-pathways" aria-label="Esplora Italianamente">
          <Link href="/grammar">
            <strong>Lingua</strong>
            <span>Parole e grammatica →</span>
          </Link>
          <Link href="/culture">
            <strong>Cultura</strong>
            <span>Modi di dire e barzellette →</span>
          </Link>
          <Link href="/multimedia">
            <strong>Vita italiana</strong>
            <span>Curiosità sull’Italia →</span>
          </Link>
        </nav>
      <section className="home-latest" id="articoli" aria-labelledby="articles-title">
      {lastUpdatedLabel && (
        <p className="home-metadata">
          Ultimo aggiornamento · {" "}
          <time dateTime={lastUpdatedSource ?? undefined}>{lastUpdatedLabel}</time>
        </p>
      )}
      <h2 id="articles-title">Da leggere con calma</h2>
      <div className="home-articles">
      {page.tiles?.map((tile, index) => {
        const referencedPost = tile.referencedPost;
        const displayCategory = tile.category || referencedPost?.category;
        const displayTitle = tile.title || referencedPost?.title;
        const slug = referencedPost?._sys.relativePath.replace(/\.mdx$/, "");
        const postHref = slug ? `/${slug}` : null;
        const tileContent = (
          <article className="home-card">
            <div className="home-card-art" aria-hidden="true">
              <img src={`/design/${["letters", "sun", "question"][index % 3]}.png`} alt="" />
            </div>
            <div className="home-card-body">
            <div>
              {displayCategory && (
                <span className="tile-category">{displayCategory}</span>
              )}
              {displayTitle && <h3>{displayTitle}</h3>}
              <div className="tile-content">
                {tile.description && (
                  <p>{tile.description}</p>
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
            <div className="read-more">
              {tile.buttonText || (postHref ? "Leggi l'articolo" : "")}
            </div>
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
      </div>
      <Link href="/posts" className="browse-all">Esplora tutti gli articoli →</Link>
      </section>
    </main>
  );
}

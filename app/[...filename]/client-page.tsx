'use client'
import { useTina } from "tinacms/dist/react";
import Link from "next/link"; // <--- IMPORT THIS

export default function ClientPage(props) {
  // Dati di Esempio (Fallback)
  const fallbackTiles = [
    { type: 'standard', category: 'Grammatica', title: 'Mi serve ricordare il futuro?', points: ['Quando lo uso', 'Come si forma'], linkText: 'Clicca per leggere' },
    { type: 'idiom', category: 'Modo di dire', title: 'In bocca al lupo', content: 'Crepi il lupo!' }
  ];

  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const tiles = data?.page?.tiles || fallbackTiles;

  return (
    <div className="page-wrapper">
        <header>
          <div className="topBar"><a href="/about">About</a><a href="mailto:tiziana.mazzotta25@gmail.com">Contact</a></div>
          <div className="brandArea">
            <h1>ITALIANAMENTE</h1>
            <p className="subtitle">Impara l'italiano con Tiziana</p>
          </div>
          <nav className="mainNav">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/grammar">Grammatica</a></li>
              <li><a href="/culture">Cultura</a></li>
              <li><a href="/multimedia">Multimedia</a></li>
            </ul>
          </nav>
        </header>

        <main className="container">
          {tiles && tiles.map((tile, i) => {
            // LOGIC: Build the URL from the postReference breadcrumbs
            let href = null;
            if (tile.postReference && tile.postReference._sys && tile.postReference._sys.breadcrumbs) {
               href = `/post/${tile.postReference._sys.breadcrumbs.join("/")}`;
            }

            // Define the Card Content (so we don't repeat code)
            const CardContent = (
              <article className={`tile ${tile.type === 'idiom' ? 'idiom' : ''}`}>
                <div>
                  <span className="tileCategory" data-tina-field={tile.category}>{tile.category}</span>
                  <h3 data-tina-field={tile.title}>{tile.title}</h3>
                  <div className="tileContent">
                    {tile.points ? (
                      <ul>{tile.points.map((p, x) => <li key={x}>{p}</li>)}</ul>
                    ) : (<p data-tina-field={tile.content}>{tile.content}</p>)}
                  </div>
                </div>
                {tile.linkText && <div className="readMore">{tile.linkText} ↓</div>}
              </article>
            );

            // If we have a link, wrap the card. If not, just show the card.
            return href ? (
              <Link key={i} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                {CardContent}
              </Link>
            ) : (
              <div key={i}>{CardContent}</div>
            );
          })}
        </main>
    </div>
  );
}
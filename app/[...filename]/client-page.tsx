'use client'
import { useTina } from "tinacms/dist/react";
import Link from "next/link";

export default function ClientPage(props) {
  // Fallback data matched to your Schema names
  const fallbackTiles = [
    { style: 'standard', category: 'Grammatica', title: 'Futuro Semplice', bulletPoints: ['Quando usarlo', 'Esempi'], buttonText: 'Leggi' },
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
            // 1. Build the Link
            let href = null;
            if (tile.postReference && tile.postReference._sys && tile.postReference._sys.breadcrumbs) {
               href = `/post/${tile.postReference._sys.breadcrumbs.join("/")}`;
            }

            // 2. Define Card Content (Using YOUR Schema names: style, description, bulletPoints)
            const CardContent = (
              <article className={`tile ${tile.style === 'idiom' ? 'idiom' : ''}`}>
                <div>
                  <span className="tileCategory" data-tina-field={tile.category}>{tile.category}</span>
                  <h3 data-tina-field={tile.title}>{tile.title}</h3>
                  <div className="tileContent">
                    {tile.bulletPoints && tile.bulletPoints.length > 0 ? (
                      <ul>{tile.bulletPoints.map((p, x) => <li key={x}>{p}</li>)}</ul>
                    ) : (
                      <p data-tina-field={tile.description}>{tile.description}</p>
                    )}
                  </div>
                </div>
                {tile.buttonText && <div className="readMore">{tile.buttonText} ↓</div>}
              </article>
            );

            // 3. Render Link or plain Card
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
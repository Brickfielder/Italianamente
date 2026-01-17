'use client'
import { useTina } from "tinacms/dist/react";
import Link from "next/link";
import { ABOUT_PAGE_HREF } from "../constants/routes";

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

  const buildSlug = (postReference) => {
    const relativePath = postReference?._sys?.relativePath;
    if (relativePath) {
      return relativePath.replace(/\.mdx$/, "");
    }

    const breadcrumbs = postReference?._sys?.breadcrumbs;
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs.join("/");
    }

    const filename = postReference?._sys?.filename;
    if (filename) {
      return filename.replace(/\.mdx$/, "");
    }

    return null;
  };

  return (
    <div className="page-wrapper">
        <header>
          <div className="topBar"><Link href={ABOUT_PAGE_HREF}>About</Link><a href="mailto:tiziana.mazzotta25@gmail.com">Contact</a></div>
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
            const slug = buildSlug(tile.postReference);
            if (slug) {
              href = `/${slug}`;
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

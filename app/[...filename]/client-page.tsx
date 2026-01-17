'use client'
import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
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

  const pageTitle = data?.page?.title;
  const pageBody = data?.page?.body;
  const tiles = data?.page?.tiles;
  const resolvedTiles = tiles && tiles.length > 0 ? tiles : (!pageBody ? fallbackTiles : []);

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
        <main className="container">
          {pageTitle && resolvedTiles.length === 0 && (
            <article className="tile">
              <div>
                <h3>{pageTitle}</h3>
                {pageBody && (
                  <div className="tile-content">
                    <TinaMarkdown content={pageBody} />
                  </div>
                )}
              </div>
            </article>
          )}

          {resolvedTiles.length > 0 && resolvedTiles.map((tile, i) => {
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
                  <span className="tile-category" data-tina-field={tile.category}>{tile.category}</span>
                  <h3 data-tina-field={tile.title}>{tile.title}</h3>
                  <div className="tile-content">
                    {tile.bulletPoints && tile.bulletPoints.length > 0 ? (
                      <ul>{tile.bulletPoints.map((p, x) => <li key={x}>{p}</li>)}</ul>
                    ) : (
                      <p data-tina-field={tile.description}>{tile.description}</p>
                    )}
                  </div>
                </div>
                {tile.buttonText && <div className="read-more">{tile.buttonText} ↓</div>}
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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostListItem } from "./posts-data";

type PostsPageProps = {
  posts: PostListItem[];
  title?: string;
  intro?: string;
};

const normalize = (value: string) => value.toLowerCase().trim();

const bodyToText = (body: unknown) => {
  if (!body) {
    return "";
  }

  try {
    return JSON.stringify(body);
  } catch {
    return "";
  }
};

export default function PostsPage({ posts, title, intro }: PostsPageProps) {
  const [keyword, setKeyword] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        if (tag) {
          set.add(tag);
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return posts.filter((post) => {
      const title = post.title ?? "";
      const category = post.category ?? "";
      const tags = post.tags ?? [];
      const bodyText = bodyToText(post.body ?? "");

      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        normalize(title).includes(normalizedKeyword) ||
        normalize(category).includes(normalizedKeyword) ||
        normalize(tags.join(" ")).includes(normalizedKeyword) ||
        normalize(bodyText).includes(normalizedKeyword);

      const matchesTags =
        activeTags.length === 0 ||
        tags.some((tag) => activeTags.includes(tag));

      return matchesKeyword && matchesTags;
    });
  }, [activeTags, keyword, posts]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="posts-page">
      {(title || intro) && (
        <header className="posts-header">
          {title && <h2>{title}</h2>}
          {intro && <p>{intro}</p>}
        </header>
      )}
      <section className="search-panel">
        <div className="search-panel__field">
          <label htmlFor="post-search">Cerca per parola chiave</label>
          <input
            id="post-search"
            type="search"
            placeholder="Titolo, categoria, testo..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div className="search-panel__tags">
          <span className="search-panel__label">Tag</span>
          <div className="tag-list">
            {availableTags.length === 0 && (
              <span className="tag-empty">Nessun tag disponibile.</span>
            )}
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-pill ${activeTags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container posts-results">
        {filteredPosts.length === 0 && (
          <p className="no-results">Nessun risultato trovato.</p>
        )}
        {filteredPosts.map((post) => {
          // FIX 2: Use breadcrumbs to build the full URL path (e.g. grammar/modo-di-dire)
          // We fallback to filename just in case breadcrumbs is missing.
          const slug =
            post._sys?.relativePath?.replace(/\.mdx$/, "") ||
            post._sys?.breadcrumbs?.join("/") ||
            post._sys?.filename?.replace(/\.mdx$/, "");
          
          if (!slug) {
            return null;
          }

          return (
            <Link key={slug} href={`/${slug}`} className="tile-link">
              <article className="tile">
                <div>
                  {post.category && (
                    <span className="tile-category">{post.category}</span>
                  )}
                  {post.title && <h3>{post.title}</h3>}
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag) => (
                        <span key={tag} className="post-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="read-more">Leggi l'articolo</div>
              </article>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

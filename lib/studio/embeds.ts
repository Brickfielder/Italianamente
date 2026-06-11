const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "player.vimeo.com",
  "open.spotify.com",
  "w.soundcloud.com",
]);

const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const decodeAttribute = (value: string) =>
  value.replaceAll("&quot;", '"').replaceAll("&amp;", "&");

export function normalizeEmbedUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported URL protocol");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    if (!videoId) throw new Error("Missing YouTube video ID");
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const videoId =
      url.searchParams.get("v") ||
      (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : "");
    if (!videoId) throw new Error("Missing YouTube video ID");
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const videoId =
      host === "player.vimeo.com" && parts[0] === "video"
        ? parts[1]
        : parts.at(-1);
    if (!videoId) throw new Error("Missing Vimeo video ID");
    return `https://player.vimeo.com/video/${videoId}`;
  }

  if (host === "open.spotify.com") {
    const path = url.pathname.startsWith("/embed/")
      ? url.pathname
      : `/embed${url.pathname}`;
    return `https://open.spotify.com${path}`;
  }

  if (host === "soundcloud.com") {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      url.toString()
    )}`;
  }

  throw new Error("Unsupported embed provider");
}

export function createEditorEmbedPlaceholder(embedUrl: string) {
  const safeUrl = escapeAttribute(embedUrl);
  return `<div class="studio-video-placeholder" data-embed-url="${safeUrl}" contenteditable="false"><strong>Video incorporato</strong><span>${safeUrl}</span></div>`;
}

const iframeForEmbedUrl = (embedUrl: string) => {
  const safeUrl = escapeAttribute(embedUrl);
  return `<figure class="studio-embed-frame"><iframe src="${safeUrl}" title="Contenuto multimediale" loading="lazy" allowfullscreen></iframe><figcaption><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Apri contenuto multimediale</a></figcaption></figure>`;
};

const tryNormalizeEmbedUrl = (raw: string) => {
  try {
    return normalizeEmbedUrl(decodeAttribute(raw).trim());
  } catch {
    return null;
  }
};

const standaloneEmbedLinksToPublishedHtml = (html: string) =>
  html
    .replace(
      /<p>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
      (match, href: string) => {
        const embedUrl = tryNormalizeEmbedUrl(href);
        return embedUrl ? iframeForEmbedUrl(embedUrl) : match;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/[^\s<]+)\s*<\/p>/gi,
      (match, rawUrl: string) => {
        const embedUrl = tryNormalizeEmbedUrl(rawUrl);
        return embedUrl ? iframeForEmbedUrl(embedUrl) : match;
      }
    );

const standaloneEmbedLinksToEditorHtml = (html: string) =>
  html
    .replace(
      /<p>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
      (match, href: string) => {
        const embedUrl = tryNormalizeEmbedUrl(href);
        return embedUrl ? createEditorEmbedPlaceholder(embedUrl) : match;
      }
    )
    .replace(
      /<p>\s*(https?:\/\/[^\s<]+)\s*<\/p>/gi,
      (match, rawUrl: string) => {
        const embedUrl = tryNormalizeEmbedUrl(rawUrl);
        return embedUrl ? createEditorEmbedPlaceholder(embedUrl) : match;
      }
    );

export function editorHtmlToPublishedHtml(html: string) {
  return standaloneEmbedLinksToPublishedHtml(html).replace(
    /<div\b([^>]*)>[\s\S]*?<\/div>/gi,
    (match, attributes: string) => {
      const className = attributes.match(/\bclass=["']([^"']+)["']/i)?.[1];
      const encodedUrl = attributes.match(
        /\bdata-embed-url=["']([^"']+)["']/i
      )?.[1];
      if (
        !className?.split(/\s+/).includes("studio-video-placeholder") ||
        !encodedUrl
      ) {
        return match;
      }

      const embedUrl = decodeAttribute(encodedUrl);
      try {
        const url = new URL(embedUrl);
        if (!EMBED_HOSTS.has(url.hostname)) return "<p></p>";
      } catch {
        return "<p></p>";
      }

      return iframeForEmbedUrl(embedUrl);
    }
  );
}

export function publishedHtmlToEditorHtml(html: string) {
  return standaloneEmbedLinksToEditorHtml(html).replace(
    /<figure\b[^>]*class=["'][^"']*\bstudio-embed-frame\b[^"']*["'][^>]*>[\s\S]*?<iframe\b[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi,
    (_match, encodedUrl: string) => {
      const embedUrl = decodeAttribute(encodedUrl);
      try {
        const url = new URL(embedUrl);
        if (!EMBED_HOSTS.has(url.hostname)) return "";
      } catch {
        return "";
      }
      return createEditorEmbedPlaceholder(embedUrl);
    }
  ).replace(
    /<iframe\b[^>]*src=["']([^"']+)["'][^>]*>(?:<\/iframe>)?/gi,
    (_match, encodedUrl: string) => {
      const embedUrl = decodeAttribute(encodedUrl);
      try {
        const url = new URL(embedUrl);
        if (!EMBED_HOSTS.has(url.hostname)) return "";
      } catch {
        return "";
      }
      return createEditorEmbedPlaceholder(embedUrl);
    }
  );
}

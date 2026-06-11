import sanitizeHtml from "sanitize-html";

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "player.vimeo.com",
  "open.spotify.com",
  "w.soundcloud.com",
]);

export function sanitizeEditorHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "img",
      "figure",
      "figcaption",
      "iframe",
      "video",
      "audio",
      "source",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
      "font",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "loading",
        "allow",
        "allowfullscreen",
      ],
      audio: ["src", "controls", "preload"],
      video: ["src", "controls", "preload", "poster", "width", "height"],
      source: ["src", "type"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      figure: ["class"],
      p: ["style"],
      li: ["style"],
      blockquote: ["style"],
      div: ["class", "data-embed-url", "style"],
      span: ["class", "style"],
      font: ["face", "color", "size"],
    },
    allowedStyles: {
      p: {
        "text-align": [/^(left|justify)$/],
      },
      li: {
        "text-align": [/^(left|justify)$/],
      },
      blockquote: {
        "text-align": [/^(left|justify)$/],
      },
      div: {
        "text-align": [/^(left|justify)$/],
      },
      span: {
        "font-family": [
          /^(Lato|Playfair Display|Arial|Georgia|Times New Roman|Verdana|Courier New)(,\s*(serif|sans-serif|monospace))?$/i,
        ],
        color: [
          /^#[0-9a-f]{3,8}$/i,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
        ],
        "font-size": [/^(12|14|16|18|24|28|32)px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      video: ["http", "https"],
      audio: ["http", "https"],
      source: ["http", "https"],
    },
    transformTags: {
      a: (_tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            ...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {}),
          },
        };
      },
      iframe: (_tagName, attribs) => {
        try {
          const url = new URL(attribs.src);
          if (!EMBED_HOSTS.has(url.hostname)) {
            return { tagName: "p", attribs: {} };
          }
        } catch {
          return { tagName: "p", attribs: {} };
        }

        return {
          tagName: "iframe",
          attribs: {
            ...attribs,
            loading: "lazy",
            title: attribs.title || "Contenuto multimediale",
          },
        };
      },
      font: (_tagName, attribs) => {
        const fontSizes: Record<string, string> = {
          "1": "12px",
          "2": "14px",
          "3": "16px",
          "4": "18px",
          "5": "24px",
          "6": "28px",
          "7": "32px",
        };
        const styles = [
          attribs.face ? `font-family: ${attribs.face}` : "",
          attribs.color ? `color: ${attribs.color}` : "",
          attribs.size && fontSizes[attribs.size]
            ? `font-size: ${fontSizes[attribs.size]}`
            : "",
        ].filter(Boolean);
        const safeAttributes: Record<string, string> = {};
        if (styles.length) {
          safeAttributes.style = styles.join("; ");
        }

        return {
          tagName: "span",
          attribs: safeAttributes,
        };
      },
      div: (_tagName, attribs) => {
        if (
          attribs.class === "studio-video-placeholder" &&
          attribs["data-embed-url"]
        ) {
          try {
            const url = new URL(attribs["data-embed-url"]);
            if (EMBED_HOSTS.has(url.hostname)) {
              return {
                tagName: "iframe",
                attribs: {
                  src: url.toString(),
                  title: "Contenuto multimediale",
                  loading: "lazy",
                  allowfullscreen: "",
                },
              };
            }
          } catch {
            return { tagName: "p", attribs: {} };
          }
        }

        return { tagName: "div", attribs };
      },
    },
  });
}

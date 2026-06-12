"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { normalizeImageSrc } from "../../lib/content/images";
import type { HomeTile } from "../../lib/content/types";
import {
  createEditorEmbedPlaceholder,
  editorHtmlToPublishedHtml,
  normalizeEmbedUrl,
  publishedHtmlToEditorHtml,
} from "../../lib/studio/embeds";
import type { StudioDocument } from "../../lib/studio/types";
import {
  applyStudioPatch,
  filterStudioPosts,
  mergeStudioDocument,
  publishingLabels,
  seedTileFromPost,
} from "../../lib/studio/ui";

type SaveState = "saved" | "saving" | "dirty" | "error";
type InsertDialog = "link" | "image" | "video" | "audio" | null;
type PreviewMode = "article" | "card" | "mobile";
type MobileWorkspace = "content" | "edit" | "preview";
const MESSAGE_DURATION_MS = 4000;
const LONG_PRESS_DURATION_MS = 650;

const CATEGORIES = [
  "Grammatica",
  "Prossima vacanza",
  "Modo di dire",
  "Barzelletta",
  "Ricetta",
  "Film",
  "Curiosità",
  "Attualità",
  "Canzoni",
];

const FONT_OPTIONS = [
  { label: "Lato", value: "Lato" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Verdana", value: "Verdana" },
  { label: "Courier New", value: "Courier New" },
];

const FONT_SIZE_OPTIONS = [
  { label: "12 px", value: "1" },
  { label: "14 px", value: "2" },
  { label: "16 px", value: "3" },
  { label: "18 px", value: "4" },
  { label: "24 px", value: "5" },
  { label: "28 px", value: "6" },
  { label: "32 px", value: "7" },
];

const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const postReferenceToHref = (postReference?: string) =>
  postReference
    ? `/${postReference.replace(/^content\//, "").replace(/\.mdx$/, "")}`
    : null;

type StudioIconName =
  | "audio"
  | "content"
  | "divider"
  | "edit"
  | "image"
  | "justify"
  | "link"
  | "list"
  | "numberedList"
  | "preview"
  | "quote"
  | "table"
  | "video";

function StudioIcon({ name }: { name: StudioIconName }) {
  const paths: Record<StudioIconName, ReactNode> = {
    audio: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    content: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <path d="M7 3v6M7 9l-2-2M7 9l2-2" />
      </>
    ),
    divider: (
      <>
        <path d="M4 12h16" />
        <path d="m8 8-2 4 2 4M16 8l2 4-2 4" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l11-11-4-4L4 16z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    justify: (
      <>
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h12M9 12h12M9 18h12" />
        <circle cx="4" cy="6" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r=".8" fill="currentColor" stroke="none" />
      </>
    ),
    numberedList: (
      <>
        <path d="M10 6h11M10 12h11M10 18h11" />
        <path d="M4 4v4M3 5l1-1h1M3 11h2l-2 3h2M3 17h2l-2 3h2" />
      </>
    ),
    preview: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    quote: (
      <>
        <path d="M7 17H4a2 2 0 0 1-2-2v-3a6 6 0 0 1 6-6v3a3 3 0 0 0-3 3h2z" />
        <path d="M19 17h-3a2 2 0 0 1-2-2v-3a6 6 0 0 1 6-6v3a3 3 0 0 0-3 3h2z" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16M15 4v16" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-2v8l-4-2z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="toolbar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function PreviewTileCard({
  tile,
  className = "",
}: {
  tile: HomeTile;
  className?: string;
}) {
  const articleHref = postReferenceToHref(tile.postReference);
  const buttonLabel =
    tile.buttonText || (articleHref ? "Leggi l'articolo" : "");

  return (
    <section
      className={`preview-tile ${tile.style ?? ""} ${className}`.trim()}
    >
      <small>{tile.category}</small>
      <h2>{tile.title}</h2>
      {tile.description && <p>{tile.description}</p>}
      {articleHref && buttonLabel && (
        <a
          className="preview-card-link"
          href={articleHref}
          target="_blank"
          rel="noreferrer"
        >
          {buttonLabel}
        </a>
      )}
      {!articleHref && tile.buttonText && (
        <span
          className="preview-card-link preview-card-link--disabled"
          title="Seleziona un articolo per attivare il pulsante"
        >
          {tile.buttonText}
        </span>
      )}
    </section>
  );
}

function DocumentPreview({ document }: { document: StudioDocument }) {
  const imageSrc = normalizeImageSrc(document.image);

  if (document.documentType === "home") {
    return (
      <div className="preview-grid">
        {document.tiles?.map((tile, index) => (
          <PreviewTileCard tile={tile} key={index} />
        ))}
      </div>
    );
  }

  return (
    <>
      {document.category && <small>{document.category}</small>}
      <h1>{document.title}</h1>
      {document.excerpt && (
        <>
          <p className="preview-excerpt">{document.excerpt}</p>
          <span className="preview-accent" aria-hidden="true" />
        </>
      )}
      {imageSrc && (
        <div
          className="preview-cover-image"
          style={{
            maxWidth: `${
              document.imageDisplayWidth ?? document.imageWidth ?? 1200
            }px`,
          }}
        >
          <Image
            src={imageSrc}
            alt=""
            width={document.imageWidth ?? 800}
            height={document.imageHeight ?? 450}
            unoptimized
          />
        </div>
      )}
      <div
        className="post-content"
        dangerouslySetInnerHTML={{
          __html: editorHtmlToPublishedHtml(document.body),
        }}
      />
    </>
  );
}

export default function StudioApp({
  initialDocuments,
  userEmail,
  demoMode = false,
}: {
  initialDocuments: StudioDocument[];
  userEmail: string;
  demoMode?: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedPath, setSelectedPath] = useState(
    initialDocuments[0]?.documentPath ?? ""
  );
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [insertDialog, setInsertDialog] = useState<InsertDialog>(null);
  const [insertUrl, setInsertUrl] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("article");
  const [mobileWorkspace, setMobileWorkspace] =
    useState<MobileWorkspace>("content");
  const [deleteCandidate, setDeleteCandidate] =
    useState<StudioDocument | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorPanelRef = useRef<HTMLElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const messageTimer = useRef<number | undefined>(undefined);
  const longPressTimer = useRef<number | undefined>(undefined);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const suppressArticleClick = useRef<string | null>(null);
  const selectionRef = useRef<Range | null>(null);

  const selected = useMemo(
    () => documents.find((document) => document.documentPath === selectedPath),
    [documents, selectedPath]
  );
  const posts = useMemo(
    () => documents.filter((document) => document.documentType === "post"),
    [documents]
  );
  const articleCategories = useMemo(
    () =>
      Array.from(
        new Set(posts.map((post) => post.category).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b, "it")),
    [posts]
  );
  const filteredPosts = useMemo(
    () => filterStudioPosts(documents, articleSearch, articleCategory),
    [articleCategory, articleSearch, documents]
  );
  const publishing = selected ? publishingLabels(selected) : null;
  const homeDocument = useMemo(
    () => documents.find((document) => document.documentType === "home"),
    [documents]
  );
  const previewTile = useMemo(() => {
    if (!selected || selected.documentType !== "post") {
      return null;
    }
    const linkedTile = homeDocument?.tiles?.find(
      (tile) => tile.postReference === selected.documentPath
    );
    return linkedTile
      ? seedTileFromPost(linkedTile, selected)
      : {
        style: "standard" as const,
        title: selected.title,
        category: selected.category,
        description: selected.excerpt,
        postReference: selected.documentPath,
        buttonText: "Leggi l'articolo",
      };
  }, [homeDocument, selected]);

  const updateSelected = useCallback(
    (
      patch: Partial<StudioDocument>,
      options?: { invalidatePreview?: boolean }
    ) => {
      setDocuments((current) =>
        current.map((document) =>
          document.documentPath === selectedPath
            ? options?.invalidatePreview === false
              ? mergeStudioDocument(document, patch)
              : applyStudioPatch(document, patch)
            : document
        )
      );
      setSaveState("dirty");
    },
    [selectedPath]
  );

  const showMessage = useCallback((value: string) => {
    window.clearTimeout(messageTimer.current);
    setMessage(value);
    if (!value) {
      return;
    }
    messageTimer.current = window.setTimeout(() => {
      setMessage("");
      messageTimer.current = undefined;
    }, MESSAGE_DURATION_MS);
  }, []);

  const refreshPreviewStatus = useCallback(
    async (document: StudioDocument, options?: { silent?: boolean }) => {
      if (!document.id || !document.pullRequestNumber || document.previewUrl) {
        return;
      }

      try {
        const response = await fetch("/api/studio/preview-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: document.id }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message);
        }

        const previewUrl = result.ready ? result.previewUrl : null;
        setDocuments((current) =>
          current.map((item) =>
            item.documentPath === document.documentPath
              ? {
                  ...item,
                  previewUrl,
                  pullRequestUrl: result.pullRequestUrl ?? item.pullRequestUrl,
                }
              : item
          )
        );

        if (previewUrl) {
          showMessage("Anteprima pronta. Puoi aprirla ora.");
          return;
        }

        if (!options?.silent) {
          showMessage("Anteprima in preparazione. La troverai qui appena pronta.");
        }
      } catch (error) {
        if (!options?.silent) {
          showMessage(
            error instanceof Error
              ? error.message
              : "Impossibile controllare lo stato dell'anteprima."
          );
        }
      }
    },
    [showMessage]
  );

  useEffect(() => {
    if (editorRef.current && selected?.documentType !== "home") {
      const editableBody = publishedHtmlToEditorHtml(
        selected?.body || "<p></p>"
      );
      editorRef.current.innerHTML = editableBody;
      if (editableBody !== selected?.body) {
        updateSelected({ body: editableBody }, { invalidatePreview: false });
      }
    }
    // The editor owns body changes after a document is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, selected?.documentType]);

  useEffect(() => {
    if (previewMode === "card" && selected?.documentType !== "post") {
      setPreviewMode("article");
    }
  }, [previewMode, selected?.documentType]);

  useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();
      if (
        selection?.rangeCount &&
        editorRef.current?.contains(selection.anchorNode)
      ) {
        selectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    };

    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, []);

  useEffect(() => {
    if (!selected?.id || !selected.pullRequestNumber || selected.previewUrl) {
      return;
    }

    void refreshPreviewStatus(selected, { silent: true });
    const timer = window.setInterval(() => {
      void refreshPreviewStatus(selected, { silent: true });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [
    refreshPreviewStatus,
    selected?.documentPath,
    selected?.id,
    selected?.previewUrl,
    selected?.pullRequestNumber,
  ]);

  useEffect(() => {
    editorPanelRef.current?.scrollTo({ top: 0 });
    previewStageRef.current?.scrollTo({ top: 0 });
  }, [selectedPath]);

  const save = useCallback(async (document: StudioDocument) => {
    if (demoMode) {
      setSaveState("saved");
      return document;
    }
    setSaveState("saving");
    const response = await fetch("/api/studio/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });
      const result = await response.json();
      if (!response.ok) {
        setSaveState("error");
        throw new Error(result.message || "Salvataggio non riuscito.");
      }
      setDocuments((current) =>
        current.map((item) =>
          item.documentPath === document.documentPath
            ? mergeStudioDocument(item, result as StudioDocument)
            : item
        )
      );
      setSaveState("saved");
      return result as StudioDocument;
  }, [demoMode]);

  useEffect(() => {
    if (!selected || saveState !== "dirty") {
      return;
    }
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save(selected).catch((error) => setMessage(error.message));
    }, 1200);
    return () => window.clearTimeout(saveTimer.current);
  }, [save, saveState, selected]);

  useEffect(
    () => () => {
      window.clearTimeout(messageTimer.current);
    },
    []
  );

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRef.current);
    }
    document.execCommand(command, false, value);
    updateSelected({ body: editorRef.current?.innerHTML ?? "" });
    selectionRef.current = null;
  };

  const insertHtml = (html: string) => {
    if (!selectionRef.current && editorRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selectionRef.current = range;
    }
    runCommand("insertHTML", html);
  };

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const openInsertDialog = (kind: Exclude<InsertDialog, null>) => {
    rememberSelection();
    setInsertUrl("");
    setInsertDialog(kind);
  };

  const toggleQuote = () => {
    const editor = editorRef.current;
    const range = selectionRef.current;
    if (!editor || !range) {
      runCommand("formatBlock", "blockquote");
      return;
    }

    const startElement =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as Element)
        : range.startContainer.parentElement;
    const quote = startElement?.closest("blockquote");

    if (!quote || !editor.contains(quote)) {
      runCommand("formatBlock", "blockquote");
      return;
    }

    let outermostQuote = quote as HTMLQuoteElement;
    let parentQuote = outermostQuote.parentElement?.closest("blockquote");
    while (parentQuote && editor.contains(parentQuote)) {
      outermostQuote = parentQuote;
      parentQuote = outermostQuote.parentElement?.closest("blockquote");
    }

    const nestedQuotes = Array.from(
      outermostQuote.querySelectorAll("blockquote")
    ).reverse();
    for (const nestedQuote of nestedQuotes) {
      nestedQuote.replaceWith(...Array.from(nestedQuote.childNodes));
    }
    outermostQuote.replaceWith(...Array.from(outermostQuote.childNodes));

    editor.focus();
    updateSelected({ body: editor.innerHTML });
    selectionRef.current = null;
  };

  const toggleJustify = () => {
    editorRef.current?.focus();
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRef.current);
    }

    const isJustified = document.queryCommandState("justifyFull");
    document.execCommand(isJustified ? "justifyLeft" : "justifyFull");
    updateSelected({ body: editorRef.current?.innerHTML ?? "" });
    selectionRef.current = null;
  };

  const submitInsertDialog = () => {
    const raw = insertUrl.trim();
    if (!raw || !insertDialog) {
      return;
    }

    try {
      if (insertDialog === "link") {
        runCommand("createLink", raw);
      } else if (insertDialog === "image") {
        const normalizedSrc = normalizeImageSrc(raw);
        if (!normalizedSrc) {
          throw new Error("Missing image URL");
        }
        const url = new URL(normalizedSrc);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Unsupported URL");
        }
        insertHtml(
          `<img src="${escapeAttribute(url.toString())}" alt="" /><p></p>`
        );
      } else if (insertDialog === "video") {
        const src = normalizeEmbedUrl(raw);
        insertHtml(`${createEditorEmbedPlaceholder(src)}<p></p>`);
      } else {
        const url = new URL(raw);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Unsupported URL");
        }
        insertHtml(
          `<audio src="${escapeAttribute(
            url.toString()
          )}" controls preload="metadata"></audio><p></p>`
        );
      }
      setInsertDialog(null);
      setInsertUrl("");
    } catch {
      showMessage(
        insertDialog === "video"
          ? "Video non valido. Usa un link YouTube, Vimeo, Spotify o SoundCloud."
          : "URL non valido."
      );
    }
  };

  const uploadMedia = async (
    file: File,
    kind: "image" | "video" | "audio",
    asCover = false
  ) => {
    if (demoMode) {
      showMessage(
        "Gli upload locali richiedono Vercel Blob e sono disattivati nella demo."
      );
      return;
    }
    setBusy(true);
    showMessage(`Caricamento ${kind === "image" ? "immagine" : kind}...`);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/studio/upload",
      });
      if (asCover) {
        updateSelected({ image: blob.url });
      } else if (kind === "image") {
        insertHtml(
          `<img src="${escapeAttribute(blob.url)}" alt="" /><p></p>`
        );
      } else if (kind === "video") {
        insertHtml(
          `<video src="${escapeAttribute(
            blob.url
          )}" controls preload="metadata"></video><p></p>`
        );
      } else {
        insertHtml(
          `<audio src="${escapeAttribute(
            blob.url
          )}" controls preload="metadata"></audio><p></p>`
        );
      }
      setInsertDialog(null);
      showMessage("File caricato.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Upload non riuscito.");
    } finally {
      setBusy(false);
    }
  };

  const createPost = () => {
    const selectedFolder =
      selected?.documentType === "post"
        ? selected.documentPath.split("/")[1]
        : "culture";
    const folder = ["grammar", "culture", "multimedia"].includes(selectedFolder)
      ? selectedFolder
      : "culture";
    const documentPath = `content/${folder}/bozza-${Date.now()}.mdx`;
    const category =
      folder === "grammar"
        ? "Grammatica"
        : folder === "multimedia"
          ? "Film"
          : "Curiosità";

    const document: StudioDocument = {
      documentPath,
      documentType: "post",
      contentOrigin: "new",
      title: "Nuovo articolo",
      excerpt: "",
      category,
      tags: [],
      status: "published",
      body: "<p>Inizia a scrivere qui...</p>",
    };
    setDocuments((current) => [...current, document]);
    setSelectedPath(document.documentPath);
    setMobileWorkspace("edit");
    setSaveState("dirty");
    showMessage("");
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  };

  const cancelLongPress = () => {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = undefined;
    longPressOrigin.current = null;
  };

  const requestArticleDelete = (document: StudioDocument) => {
    cancelLongPress();
    setDeleteCandidate(document);
  };

  const deleteArticle = async () => {
    if (!deleteCandidate) {
      return;
    }

    const documentPath = deleteCandidate.documentPath;
    const fallbackPath =
      documents.find(
        (document) =>
          document.documentType === "home" &&
          document.documentPath !== documentPath
      )?.documentPath ??
      documents.find((document) => document.documentPath !== documentPath)
        ?.documentPath ??
      "";

    window.clearTimeout(saveTimer.current);
    setBusy(true);
    setSaveState("saving");
    try {
      if (!demoMode) {
        const response = await fetch("/api/studio/documents", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentPath,
            documentType: deleteCandidate.documentType,
            contentOrigin: deleteCandidate.contentOrigin,
            title: deleteCandidate.title,
            previewBranch: deleteCandidate.previewBranch,
            pullRequestNumber: deleteCandidate.pullRequestNumber,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Eliminazione non riuscita.");
        }
      }

      setDocuments((current) =>
        current
          .filter((document) => document.documentPath !== documentPath)
          .map((document) =>
            document.documentType === "home"
              ? {
                  ...document,
                  tiles: document.tiles?.filter(
                    (tile) => tile.postReference !== documentPath
                  ),
                }
              : document
          )
      );
      if (selectedPath === documentPath) {
        setSelectedPath(fallbackPath);
      }
      setDeleteCandidate(null);
      setMobileWorkspace("content");
      setSaveState("saved");
      showMessage(
        demoMode
          ? "Articolo rimosso dalla demo."
          : "Articolo eliminato dal sito."
      );
    } catch (error) {
      setSaveState("dirty");
      showMessage(
        error instanceof Error ? error.message : "Eliminazione non riuscita."
      );
    } finally {
      setBusy(false);
    }
  };

  const createPreview = async () => {
    if (!selected) return;
    if (demoMode) {
      showMessage("Collega i servizi per creare una vera anteprima Vercel.");
      return;
    }
    setBusy(true);
    showMessage("Creazione dell'anteprima Vercel...");
    try {
      const response = await fetch("/api/studio/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setDocuments((current) =>
        current.map((item) =>
          item.documentPath === selected.documentPath
            ? mergeStudioDocument(item, result)
            : item
        )
      );
      setSaveState("saved");
      if (result.previewUrl) {
        showMessage("Anteprima pronta.");
      } else if (result.pullRequestNumber) {
        showMessage("Anteprima richiesta. La troverai qui appena pronta.");
        void refreshPreviewStatus(
          { ...selected, ...result },
          { silent: true }
        );
      } else {
        showMessage("Anteprima richiesta.");
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Anteprima non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!selected?.id || !selected.pullRequestNumber || !selected.previewUrl) {
      return;
    }
    if (!window.confirm("Pubblicare questa anteprima sul sito?")) return;
    setBusy(true);
    showMessage("Pubblicazione in corso...");
    try {
      const response = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      updateSelected({
        contentOrigin: "repository",
        draftStatus: "published",
      });
      showMessage("Pubblicato. Vercel sta aggiornando il sito.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Pubblicazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  if (!selected) {
    return <main className="studio-shell">Nessun contenuto disponibile.</main>;
  }

  const selectDocument = (documentPath: string) => {
    setSelectedPath(documentPath);
    setMobileWorkspace("edit");
  };
  const saveStateLabel =
    saveState === "saved"
      ? "Salvato automaticamente"
      : saveState === "saving"
        ? "Salvataggio in corso..."
        : saveState === "error"
          ? "Errore di salvataggio"
          : "Modifiche non salvate";
  const mobileSaveStateLabel =
    saveState === "saved"
      ? "Salvato"
      : saveState === "saving"
        ? "Salvataggio..."
        : saveState === "error"
          ? "Errore"
          : "Da salvare";

  return (
    <main className={`studio-shell studio-shell--${mobileWorkspace}`}>
      <header className="studio-topbar">
        <div className="studio-brand">
          <strong>Italianamente Studio</strong>
          <span>{userEmail}</span>
        </div>
        <div className="studio-actions">
          <span className={`save-state save-state--${saveState}`}>
            <span className="save-state-label--desktop">{saveStateLabel}</span>
            <span className="save-state-label--mobile">
              {mobileSaveStateLabel}
            </span>
          </span>
          <span className="publishing-status">{publishing?.status}</span>
          <button
            className="preview-action"
            disabled={busy}
            onClick={createPreview}
          >
            Crea anteprima
          </button>
          <button
            className="primary"
            disabled={busy || demoMode || !selected.previewUrl}
            onClick={publish}
            title={
              selected.previewUrl
                ? publishing?.action
                : selected.pullRequestNumber
                  ? "Attendi che l'anteprima sia pronta"
                  : "Crea prima un'anteprima per abilitare la pubblicazione"
            }
          >
            {publishing?.action}
          </button>
          {!selected.previewUrl && (
            <span className="publish-hint">
              {selected.pullRequestNumber
                ? "Attendi l'anteprima"
                : "Prima crea l'anteprima"}
            </span>
          )}
        </div>
      </header>

      <section className="mobile-document-bar" aria-label="Contenuto selezionato">
        <button
          className="mobile-content-trigger"
          type="button"
          onClick={() => setMobileWorkspace("content")}
          aria-label="Apri contenuti"
        >
          <StudioIcon name="content" />
        </button>
        <div className="mobile-document-title">
          <small>
            {selected.documentType === "post"
              ? selected.category
              : selected.documentType === "home"
                ? "Homepage"
                : "Pagina"}
          </small>
          <strong>{selected.title}</strong>
        </div>
        <div className="mobile-document-actions">
          <button
            type="button"
            disabled={busy}
            onClick={createPreview}
          >
            Crea anteprima
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy || demoMode || !selected.previewUrl}
            onClick={publish}
          >
            Pubblica
          </button>
        </div>
      </section>

      <aside className="studio-sidebar">
        <button
          className="new-content-button"
          onClick={createPost}
        >
          <span aria-hidden="true">+</span>
          Nuovo contenuto
        </button>

        <div className="sidebar-group">
          <div className="sidebar-section-heading">
            <span>Pagine</span>
            <small>
              {
                documents.filter(
                  (document) => document.documentType !== "post"
                ).length
              }
            </small>
          </div>
          <nav className="sidebar-list" aria-label="Pagine">
            <button
              className={selected.documentType === "home" ? "active" : ""}
              onClick={() => selectDocument("content/page/home.mdx")}
            >
              <span>Homepage</span>
              <small>Pagina</small>
            </button>
            <button
              className={
                selected.documentPath === "content/page/about.mdx"
                  ? "active"
                  : ""
              }
              onClick={() => selectDocument("content/page/about.mdx")}
            >
              <span>Chi sono</span>
              <small>Pagina</small>
            </button>
          </nav>
        </div>

        <div className="sidebar-group sidebar-group--articles">
          <div className="sidebar-section-heading">
            <span>Articoli</span>
            <small>{posts.length}</small>
          </div>
          <div className="article-filters">
            <label>
              <span className="sr-only">Cerca articoli</span>
              <input
                type="search"
                value={articleSearch}
                onChange={(event) => setArticleSearch(event.target.value)}
                placeholder="Cerca articoli..."
              />
            </label>
            <label>
              <span className="sr-only">Filtra per categoria</span>
              <select
                value={articleCategory}
                onChange={(event) => setArticleCategory(event.target.value)}
              >
                <option value="">Tutte le categorie</option>
                {articleCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <small className="article-result-count">
              {filteredPosts.length === posts.length
                ? `${posts.length} articoli`
                : `${filteredPosts.length} di ${posts.length} articoli`}
            </small>
          </div>
          <nav className="sidebar-list sidebar-list--articles" aria-label="Articoli">
            {filteredPosts.map((document) => (
              <button
                key={document.documentPath}
                className={
                  document.documentPath === selectedPath ? "active" : ""
                }
                onClick={() => {
                  if (suppressArticleClick.current === document.documentPath) {
                    suppressArticleClick.current = null;
                    return;
                  }
                  selectDocument(document.documentPath);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  requestArticleDelete(document);
                }}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse") {
                    return;
                  }
                  cancelLongPress();
                  longPressOrigin.current = {
                    x: event.clientX,
                    y: event.clientY,
                  };
                  longPressTimer.current = window.setTimeout(() => {
                    suppressArticleClick.current = document.documentPath;
                    requestArticleDelete(document);
                  }, LONG_PRESS_DURATION_MS);
                }}
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerMove={(event) => {
                  const origin = longPressOrigin.current;
                  if (
                    origin &&
                    Math.hypot(
                      event.clientX - origin.x,
                      event.clientY - origin.y
                    ) > 10
                  ) {
                    cancelLongPress();
                  }
                }}
              >
                <span>{document.title}</span>
                <small>
                  {document.category}
                  <i
                    className={
                      document.contentOrigin === "new"
                        ? "article-state article-state--new"
                        : document.status === "archived"
                        ? "article-state article-state--archived"
                        : "article-state"
                    }
                  >
                    {document.contentOrigin === "new"
                      ? "Nuovo"
                      : document.status === "archived"
                      ? "Archiviato"
                      : "Pubblicato"}
                  </i>
                </small>
              </button>
            ))}
            {!filteredPosts.length && (
              <p className="sidebar-empty">Nessun articolo trovato.</p>
            )}
          </nav>
        </div>
      </aside>

      <section className="studio-editor" ref={editorPanelRef}>
        <section className="editor-section">
          <header className="editor-section-heading">
            <span>1</span>
            <div>
              <h2>Dettagli contenuto</h2>
              <p>Le informazioni principali usate nel sito e nelle anteprime.</p>
            </div>
          </header>
          <div className="document-fields">
            <label className="field-wide">
              Titolo
              <input
                ref={titleInputRef}
                value={selected.title}
                onChange={(event) =>
                  updateSelected({ title: event.target.value })
                }
              />
            </label>
            {selected.documentType === "post" && (
              <>
                <label className="excerpt-field field-wide">
                  <span className="field-label-row">
                    <span>Estratto</span>
                    <small>{selected.excerpt?.length ?? 0} / 240 consigliati</small>
                  </span>
                  <textarea
                    value={selected.excerpt ?? ""}
                    onChange={(event) =>
                      updateSelected({ excerpt: event.target.value })
                    }
                    placeholder="Una breve descrizione per card e anteprime."
                    rows={3}
                  />
                  <small className="field-help">
                    Può essere più lungo, ma un testo breve funziona meglio nelle
                    card della homepage.
                  </small>
                </label>
              <label>
                Categoria
                <select
                  value={selected.category}
                  onChange={(event) =>
                    updateSelected({ category: event.target.value })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Tag
                <input
                  value={selected.tags?.join(", ") ?? ""}
                  onChange={(event) =>
                    updateSelected({
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <label>
                Stato
                <select
                  value={selected.status}
                  onChange={(event) =>
                    updateSelected({
                      status: event.target.value as "published" | "archived",
                    })
                  }
                >
                  <option value="published">Pubblicato</option>
                  <option value="archived">Archiviato</option>
                </select>
              </label>
              </>
            )}
          </div>
        </section>

        {selected.documentType === "post" && (
          <section className="editor-section">
            <header className="editor-section-heading">
              <span>2</span>
              <div>
                <h2>Media</h2>
                <p>Copertina dell&apos;articolo e dimensione nella pagina.</p>
              </div>
            </header>
            <div className="document-fields document-fields--media">
              <div className="cover-field field-wide">
                <span className="cover-field-label">Immagine di copertina</span>
                <div className="cover-input-row">
                <input
                  value={selected.image ?? ""}
                  onChange={(event) =>
                    updateSelected({
                      image: normalizeImageSrc(event.target.value),
                    })
                  }
                  placeholder="URL immagine"
                />
                  <label className="cover-upload-button">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadMedia(file, "image", true);
                      }}
                    />
                    Sfoglia
                  </label>
                  {selected.image && (
                    <button
                      type="button"
                      className="danger-quiet"
                      onClick={() =>
                        updateSelected({
                          image: undefined,
                          imageDisplayWidth: undefined,
                        })
                      }
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
                {selected.image && (
                  <div className="image-size-control">
                    <div className="image-size-control__header">
                      <span>Larghezza visualizzata</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelected({
                            imageDisplayWidth: 1200,
                          })
                        }
                      >
                        Larghezza piena
                      </button>
                    </div>
                    <div className="image-size-control__inputs">
                      <input
                        type="range"
                        min="150"
                        max="1200"
                        step="10"
                        value={
                          selected.imageDisplayWidth ??
                          selected.imageWidth ??
                          800
                        }
                        aria-label="Larghezza immagine"
                        onChange={(event) =>
                          updateSelected({
                            imageDisplayWidth: Number(event.target.value),
                          })
                        }
                      />
                      <label>
                        <input
                          type="number"
                          min="150"
                          max="1200"
                          step="10"
                          value={
                            selected.imageDisplayWidth ??
                            selected.imageWidth ??
                            800
                          }
                          onChange={(event) =>
                            updateSelected({
                              imageDisplayWidth: Math.min(
                                1200,
                                Math.max(150, Number(event.target.value) || 150)
                              ),
                            })
                          }
                        />
                        <span>px</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {selected.documentType === "home" ? (
          <section className="editor-section editor-section--body">
            <header className="editor-section-heading">
              <span>2</span>
              <div>
                <h2>Card homepage</h2>
                <p>Ordina e personalizza i contenuti mostrati in homepage.</p>
              </div>
            </header>
            <TileEditor
              tiles={selected.tiles ?? []}
              posts={posts}
              onChange={(tiles) => updateSelected({ tiles })}
            />
          </section>
        ) : (
          <section className="editor-section editor-section--body">
            <header className="editor-section-heading">
              <span>{selected.documentType === "post" ? "3" : "2"}</span>
              <div>
                <h2>
                  {selected.documentType === "post"
                    ? "Corpo dell'articolo"
                    : "Contenuto della pagina"}
                </h2>
                <p>Scrivi e formatta il contenuto visualizzato dai lettori.</p>
              </div>
            </header>
            <div className="editor-toolbar" role="toolbar" aria-label="Formattazione">
              <div className="toolbar-group toolbar-group--typography">
                <select
                  className="toolbar-size"
                  defaultValue=""
                  aria-label="Dimensione del carattere"
                  title="Dimensione del carattere"
                  onPointerDown={rememberSelection}
                  onChange={(event) => {
                    if (event.target.value) {
                      runCommand("fontSize", event.target.value);
                      event.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    Dimensione
                  </option>
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
                <select
                  className="toolbar-font"
                  defaultValue=""
                  aria-label="Tipo di carattere"
                  title="Tipo di carattere"
                  onPointerDown={rememberSelection}
                  onChange={(event) => {
                    if (event.target.value) {
                      runCommand("fontName", event.target.value);
                      event.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    Carattere
                  </option>
                  {FONT_OPTIONS.map((font) => (
                    <option
                      key={font.value}
                      value={font.value}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </option>
                  ))}
                </select>
                <label
                  className="toolbar-color"
                  title="Colore del testo"
                  onPointerDown={rememberSelection}
                >
                  <span className="sr-only">Colore del testo</span>
                  <input
                    type="color"
                    defaultValue="#333333"
                    aria-label="Colore del testo"
                    onChange={(event) =>
                      runCommand("foreColor", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="toolbar-separator" aria-hidden="true" />

              <div className="toolbar-group" aria-label="Stile del testo">
                <button className="toolbar-button toolbar-button--letter" title="Grassetto" aria-label="Grassetto" onClick={() => runCommand("bold")}><strong>B</strong></button>
                <button className="toolbar-button toolbar-button--letter" title="Corsivo" aria-label="Corsivo" onClick={() => runCommand("italic")}><em>I</em></button>
                <button className="toolbar-button toolbar-button--letter" title="Sottolineato" aria-label="Sottolineato" onClick={() => runCommand("underline")}><u>U</u></button>
                <button className="toolbar-button" title="Aggiungi link" aria-label="Aggiungi link" onPointerDown={rememberSelection} onClick={() => openInsertDialog("link")}><StudioIcon name="link" /></button>
                <button
                  className="toolbar-button"
                  onPointerDown={rememberSelection}
                  onClick={toggleQuote}
                  title="Attiva o rimuovi citazione"
                  aria-label="Citazione"
                >
                  <StudioIcon name="quote" />
                </button>
                <button
                  className="toolbar-button"
                  onPointerDown={rememberSelection}
                  onClick={toggleJustify}
                  title="Attiva o rimuovi testo giustificato"
                  aria-label="Giustifica testo"
                >
                  <StudioIcon name="justify" />
                </button>
              </div>

              <div className="toolbar-separator" aria-hidden="true" />

              <div className="toolbar-group" aria-label="Struttura">
                <button className="toolbar-button" title="Elenco puntato" aria-label="Elenco puntato" onClick={() => runCommand("insertUnorderedList")}><StudioIcon name="list" /></button>
                <button className="toolbar-button" title="Elenco numerato" aria-label="Elenco numerato" onClick={() => runCommand("insertOrderedList")}><StudioIcon name="numberedList" /></button>
                <button
                  className="toolbar-button"
                  title="Inserisci tabella"
                  aria-label="Inserisci tabella"
                  onClick={() =>
                    insertHtml(
                      "<table><tbody><tr><th>Intestazione</th><th>Intestazione</th></tr><tr><td>Testo</td><td>Testo</td></tr></tbody></table><p></p>"
                    )
                  }
                >
                  <StudioIcon name="table" />
                </button>
                <button className="toolbar-button" title="Inserisci divisore" aria-label="Inserisci divisore" onClick={() => insertHtml("<hr><p></p>")}><StudioIcon name="divider" /></button>
              </div>

              <div className="toolbar-separator" aria-hidden="true" />

              <div className="toolbar-group toolbar-group--media" aria-label="Media">
                <button className="toolbar-button toolbar-button--media" onPointerDown={rememberSelection} onClick={() => openInsertDialog("image")}><StudioIcon name="image" /><span>Immagine</span></button>
                <button className="toolbar-button toolbar-button--media" onPointerDown={rememberSelection} onClick={() => openInsertDialog("video")}><StudioIcon name="video" /><span>Video</span></button>
                <button className="toolbar-button toolbar-button--media" onPointerDown={rememberSelection} onClick={() => openInsertDialog("audio")}><StudioIcon name="audio" /><span>Audio</span></button>
              </div>
            </div>
            <div
              ref={editorRef}
              className="visual-editor post-content"
              contentEditable
              suppressContentEditableWarning
              onInput={() =>
                updateSelected({ body: editorRef.current?.innerHTML ?? "" })
              }
            />
          </section>
        )}
      </section>

      <aside className="studio-preview">
        <div className="preview-header">
          <div>
            <strong>Anteprima</strong>
            <span>Controlla il risultato prima di pubblicare.</span>
          </div>
          <div className="preview-header-links">
            {selected.previewUrl ? (
              <a href={selected.previewUrl} target="_blank" rel="noreferrer">
                Apri anteprima
              </a>
            ) : selected.pullRequestNumber ? (
              <span className="preview-pending-label">Anteprima in preparazione...</span>
            ) : null}
          </div>
        </div>
        <div className="preview-tabs" role="tablist" aria-label="Modalità anteprima">
          <button
            className={previewMode === "card" ? "active" : ""}
            onClick={() => setPreviewMode("card")}
            role="tab"
            aria-selected={previewMode === "card"}
            disabled={selected.documentType !== "post"}
          >
            Card homepage
          </button>
          <button
            className={previewMode === "article" ? "active" : ""}
            onClick={() => setPreviewMode("article")}
            role="tab"
            aria-selected={previewMode === "article"}
          >
            {selected.documentType === "post" ? "Articolo" : "Pagina"}
          </button>
          <button
            className={previewMode === "mobile" ? "active" : ""}
            onClick={() => setPreviewMode("mobile")}
            role="tab"
            aria-selected={previewMode === "mobile"}
          >
            Mobile
          </button>
        </div>
        <div
          ref={previewStageRef}
          className={`preview-stage ${
            previewMode === "mobile" ? "preview-stage--mobile" : ""
          }`}
        >
          <article
            className={`preview-page preview-page--${previewMode}`}
            role="tabpanel"
          >
            {previewMode === "card" && previewTile ? (
              <div className="preview-card-context">
                <span>Come apparirà nella homepage</span>
                <PreviewTileCard
                  tile={previewTile}
                  className="preview-tile--featured"
                />
              </div>
            ) : (
              <DocumentPreview document={selected} />
            )}
          </article>
        </div>
        {message && <p className="studio-message">{message}</p>}
      </aside>

      {message && <p className="mobile-studio-message">{message}</p>}

      <nav className="mobile-workspace-nav" aria-label="Area di lavoro">
        <button
          type="button"
          className={mobileWorkspace === "content" ? "active" : ""}
          aria-current={mobileWorkspace === "content" ? "page" : undefined}
          onClick={() => setMobileWorkspace("content")}
        >
          <StudioIcon name="content" />
          <span>Contenuti</span>
        </button>
        <button
          type="button"
          className={mobileWorkspace === "edit" ? "active" : ""}
          aria-current={mobileWorkspace === "edit" ? "page" : undefined}
          onClick={() => setMobileWorkspace("edit")}
        >
          <StudioIcon name="edit" />
          <span>Modifica</span>
        </button>
        <button
          type="button"
          className={mobileWorkspace === "preview" ? "active" : ""}
          aria-current={mobileWorkspace === "preview" ? "page" : undefined}
          onClick={() => {
            setPreviewMode("mobile");
            setMobileWorkspace("preview");
          }}
        >
          <StudioIcon name="preview" />
          <span>Anteprima</span>
        </button>
      </nav>

      {insertDialog && (
        <div className="studio-dialog-backdrop" role="presentation">
          <form
            className="studio-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              submitInsertDialog();
            }}
          >
            <h2>
              {insertDialog === "link"
                ? "Aggiungi link"
                : insertDialog === "image"
                ? "Inserisci immagine"
                : insertDialog === "video"
                ? "Inserisci video"
                : "Inserisci audio"}
            </h2>
            <label htmlFor="studio-insert-url">
              {insertDialog === "video"
                ? "URL YouTube, Vimeo, Spotify o SoundCloud"
                : insertDialog === "image"
                ? "URL dell'immagine"
                : insertDialog === "audio"
                ? "URL diretto del file audio"
                : "Indirizzo del link"}
            </label>
            <input
              id="studio-insert-url"
              type="url"
              value={insertUrl}
              onChange={(event) => setInsertUrl(event.target.value)}
              autoFocus
              required
              placeholder="https://..."
            />
            {insertDialog !== "link" && (
              <>
                <div className="studio-dialog-divider">
                  <span>oppure</span>
                </div>
                <label htmlFor="studio-insert-file">File dal dispositivo</label>
                <input
                  id="studio-insert-file"
                  type="file"
                  accept={
                    insertDialog === "image"
                      ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
                      : insertDialog === "video"
                      ? "video/mp4,video/webm,video/quicktime"
                      : "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
                  }
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadMedia(file, insertDialog);
                    }
                  }}
                />
                {demoMode && (
                  <small className="studio-dialog-note">
                    Il caricamento sarà disponibile dopo aver collegato Vercel
                    Blob. In questa demo puoi usare un URL.
                  </small>
                )}
              </>
            )}
            <div>
              <button
                type="button"
                onClick={() => {
                  setInsertDialog(null);
                  setInsertUrl("");
                  selectionRef.current = null;
                }}
              >
                Annulla
              </button>
              <button type="submit" className="primary">
                Inserisci
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteCandidate && (
        <div className="studio-dialog-backdrop" role="presentation">
          <section
            className="studio-dialog article-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
          >
            <h2 id="delete-article-title">Eliminare questo articolo?</h2>
            <p>
              <strong>{deleteCandidate.title}</strong>
            </p>
            <p>
              {deleteCandidate.contentOrigin === "new"
                ? "La bozza verrà rimossa definitivamente."
                : "L'articolo verrà rimosso dal sito. Anche le card della homepage collegate a questo articolo verranno eliminate."}
            </p>
            <div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeleteCandidate(null)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => void deleteArticle()}
              >
                {busy ? "Eliminazione..." : "Elimina articolo"}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

function TileEditor({
  tiles,
  posts,
  onChange,
}: {
  tiles: HomeTile[];
  posts: StudioDocument[];
  // eslint-disable-next-line no-unused-vars
  onChange: (value: HomeTile[]) => void;
}) {
  const update = (index: number, patch: Partial<HomeTile>) =>
    onChange(tiles.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...tiles];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="tile-editor">
      <button
        className="add-tile"
        onClick={() =>
          onChange([
            {
              style: "standard",
              title: "Nuova card",
              description: "",
            },
            ...tiles,
          ])
        }
      >
        + Aggiungi card
      </button>
      {tiles.map((tile, index) => (
        <section key={index}>
          <div className="tile-editor__top">
            <strong>Card {index + 1}</strong>
            <button onClick={() => move(index, -1)}>↑</button>
            <button onClick={() => move(index, 1)}>↓</button>
            <button onClick={() => onChange(tiles.filter((_, i) => i !== index))}>
              Rimuovi
            </button>
          </div>
          <label>
            Articolo
            <select
              value={tile.postReference ?? ""}
              onChange={(event) => {
                const post = posts.find(
                  (item) => item.documentPath === event.target.value
                );
                update(
                  index,
                  seedTileFromPost(
                    {
                      ...tile,
                      postReference: event.target.value,
                    },
                    post
                  )
                );
              }}
            >
              <option value="">Nessun articolo</option>
              {posts.map((post) => (
                <option key={post.documentPath} value={post.documentPath}>
                  {post.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stile
            <select
              value={tile.style ?? "standard"}
              onChange={(event) =>
                update(index, { style: event.target.value as HomeTile["style"] })
              }
            >
              <option value="standard">Standard</option>
              <option value="idiom">Modo di dire</option>
              <option value="joke">Barzelletta</option>
            </select>
          </label>
          <label>
            Titolo
            <input
              value={tile.title ?? ""}
              onChange={(event) => update(index, { title: event.target.value })}
            />
          </label>
          <label>
            Categoria
            <input
              value={tile.category ?? ""}
              onChange={(event) => update(index, { category: event.target.value })}
            />
          </label>
          <label>
            Descrizione
            <textarea
              value={tile.description ?? ""}
              onChange={(event) =>
                update(index, { description: event.target.value })
              }
            />
          </label>
          <label>
            Testo pulsante
            <input
              value={tile.buttonText ?? ""}
              onChange={(event) =>
                update(index, { buttonText: event.target.value })
              }
            />
          </label>
        </section>
      ))}
    </div>
  );
}

import type { HomeTile } from "../content/types";
import type { StudioDocument } from "./types";

const PREVIEW_INVALIDATING_FIELDS: Array<keyof StudioDocument> = [
  "title",
  "excerpt",
  "category",
  "tags",
  "image",
  "imageWidth",
  "imageHeight",
  "imageDisplayWidth",
  "status",
  "body",
  "tiles",
  "tilesLastUpdated",
];

const changed = (left: unknown, right: unknown) =>
  JSON.stringify(left) !== JSON.stringify(right);

const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it");

export function filterStudioPosts(
  documents: StudioDocument[],
  query: string,
  category: string
) {
  const search = normalized(query.trim());

  return documents.filter((document) => {
    if (document.documentType !== "post") {
      return false;
    }
    if (category && document.category !== category) {
      return false;
    }
    if (!search) {
      return true;
    }

    return normalized(
      [
        document.title,
        document.category,
        document.tags?.join(" "),
        document.excerpt,
      ]
        .filter(Boolean)
        .join(" ")
    ).includes(search);
  });
}

export function seedTileFromPost(
  tile: HomeTile,
  post: StudioDocument | undefined
): HomeTile {
  if (!post) {
    return tile;
  }

  return {
    ...tile,
    title: !tile.title || tile.title === "Nuova card" ? post.title : tile.title,
    category: tile.category || post.category,
    description: tile.description || post.excerpt,
  };
}

export function createHomeTileForPost(post: StudioDocument): HomeTile {
  return seedTileFromPost(
    {
      style: "standard",
      title: "Nuova card",
      description: "",
      postReference: post.documentPath,
      buttonText: "Leggi l'articolo",
    },
    post
  );
}

export function publishingLabels(document: StudioDocument) {
  const kind =
    document.documentType === "post"
      ? "articolo"
      : document.documentType === "home"
        ? "homepage"
        : "pagina";
  const isNew = document.contentOrigin === "new";

  return {
    status: isNew ? "Nuovo contenuto" : "Già pubblicato",
    action: isNew ? `Pubblica nuovo ${kind}` : `Aggiorna ${kind}`,
  };
}

export function mergeStudioDocument(
  current: StudioDocument,
  incoming: Partial<StudioDocument>
): StudioDocument {
  return {
    ...current,
    ...incoming,
    id: incoming.id ?? current.id,
    baseSha: incoming.baseSha ?? current.baseSha,
    previewBranch: incoming.previewBranch ?? current.previewBranch,
    pullRequestNumber: incoming.pullRequestNumber ?? current.pullRequestNumber,
    pullRequestUrl: incoming.pullRequestUrl ?? current.pullRequestUrl,
    previewUrl:
      incoming.previewUrl === undefined ? current.previewUrl : incoming.previewUrl,
    draftStatus: incoming.draftStatus ?? current.draftStatus,
  };
}

export function applyStudioPatch(
  current: StudioDocument,
  patch: Partial<StudioDocument>
): StudioDocument {
  const merged = mergeStudioDocument(current, patch);
  const invalidatesPreview = PREVIEW_INVALIDATING_FIELDS.some(
    (field) => field in patch && changed(current[field], patch[field])
  );

  if (!invalidatesPreview) {
    return merged;
  }

  return {
    ...merged,
    baseSha: undefined,
    previewBranch: undefined,
    pullRequestNumber: undefined,
    pullRequestUrl: undefined,
    previewUrl: undefined,
    draftStatus: "draft",
  };
}

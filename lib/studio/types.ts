import type { HomeTile } from "../content/types";

export type StudioDocumentType = "post" | "page" | "home";

export type StudioDocument = {
  id?: string;
  documentPath: string;
  documentType: StudioDocumentType;
  contentOrigin?: "repository" | "new";
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageDisplayWidth?: number;
  status?: "published" | "archived";
  body: string;
  tiles?: HomeTile[];
  tilesLastUpdated?: string;
  baseSha?: string;
  previewBranch?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  previewUrl?: string | null;
  draftStatus?: string;
};

export type ContentSystemInfo = {
  filename: string;
  breadcrumbs: string[];
  relativePath: string;
};

export type PostDocument = {
  title: string;
  excerpt?: string;
  category: string;
  tags: string[];
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageDisplayWidth?: number;
  status?: "published" | "archived";
  body: string;
  _sys: ContentSystemInfo;
};

export type HomeTile = {
  style?: "standard" | "idiom" | "joke";
  category?: string;
  title?: string;
  postReference?: string;
  description?: string;
  bulletPoints?: string[];
  buttonText?: string;
  referencedPost?: PostDocument | null;
};

export type PageDocument = {
  title: string;
  tilesLastUpdated?: string;
  tiles?: HomeTile[];
  body: string;
  _sys: ContentSystemInfo;
};

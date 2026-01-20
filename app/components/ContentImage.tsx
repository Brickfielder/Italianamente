import Image from "next/image";
import type { CSSProperties } from "react";

type ContentImageProps = {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

const normalizeImageSrc = (src?: string) => {
  if (!src) {
    return src;
  }

  if (src.startsWith("http") || src.startsWith("data:")) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
};

const resolveDimension = (value: number | string | undefined, fallback: number) => {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return Number.isFinite(numericValue) ? Number(numericValue) : fallback;
};

export default function ContentImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  style,
}: ContentImageProps) {
  const resolvedSrc = normalizeImageSrc(src);
  if (!resolvedSrc) {
    return null;
  }

  if (!alt && process.env.NODE_ENV !== "production") {
    console.warn("ContentImage requires alt text for accessibility.");
  }

  const resolvedWidth = resolveDimension(width, DEFAULT_WIDTH);
  const resolvedHeight = resolveDimension(height, DEFAULT_HEIGHT);
  const resolvedAlt = alt ?? "";

  return (
    <Image
      src={resolvedSrc}
      alt={resolvedAlt}
      width={resolvedWidth}
      height={resolvedHeight}
      sizes={sizes ?? "100vw"}
      className={["content-image", className].filter(Boolean).join(" ")}
      style={{ width: "100%", height: "auto", ...style }}
    />
  );
}

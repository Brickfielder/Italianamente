const NEXT_IMAGE_PATH = "/_next/image";
const MAX_PROXY_DEPTH = 5;

export function normalizeImageSrc(src?: string): string | undefined {
  const initialSrc = src?.trim();
  if (!initialSrc) {
    return initialSrc;
  }
  let resolved: string = initialSrc;

  for (let depth = 0; depth < MAX_PROXY_DEPTH; depth += 1) {
    if (!/^https?:\/\//i.test(resolved)) {
      return resolved.startsWith("data:") || resolved.startsWith("/")
        ? resolved
        : `/${resolved}`;
    }

    try {
      const url = new URL(resolved);
      if (url.pathname !== NEXT_IMAGE_PATH) {
        return resolved;
      }

      const originalSrc = url.searchParams.get("url");
      if (!originalSrc || originalSrc === resolved) {
        return resolved;
      }
      resolved = originalSrc;
    } catch {
      return resolved;
    }
  }

  return resolved;
}

export const isRemoteImageSrc = (src?: string) =>
  Boolean(src && /^https?:\/\//i.test(src));

import { describe, expect, it } from "vitest";

import { isRemoteImageSrc, normalizeImageSrc } from "./images";

describe("image helpers", () => {
  it("unwraps a copied Next image optimization URL", () => {
    expect(
      normalizeImageSrc(
        "https://preview.vercel.app/_next/image?url=https%3A%2F%2Fichef.bbci.co.uk%2Face%2Fstandard%2F976%2Fexample.jpg.webp&w=1920&q=75"
      )
    ).toBe(
      "https://ichef.bbci.co.uk/ace/standard/976/example.jpg.webp"
    );
  });

  it("normalizes local image paths", () => {
    expect(normalizeImageSrc("uploads/example.jpg")).toBe(
      "/uploads/example.jpg"
    );
  });

  it("recognizes remote image sources", () => {
    expect(isRemoteImageSrc("https://example.com/image.jpg")).toBe(true);
    expect(isRemoteImageSrc("/uploads/example.jpg")).toBe(false);
  });
});

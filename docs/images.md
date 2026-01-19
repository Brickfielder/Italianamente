# Image handling guide

## Where originals live
- Upload originals through TinaCMS. Files are stored in `public/uploads/` and committed to git.
- Keep originals unmodified; resizing happens at delivery time via Next.js Image Optimization.

## Recommended formats
- Use JPG or WebP for photos.
- Keep source images reasonably sized (ideally under ~5 MB) to keep the repo and CI fast.

## How to embed images in content
- In rich text/MDX, use standard markdown image syntax:
  - `![Alt text](/uploads/your-image.jpg)`
- The site maps markdown images to a shared `ContentImage` component, which renders with Next.js `<Image>` for responsive delivery.

## Cover images
- For posts, use the `image`, `imageWidth`, and `imageHeight` fields in TinaCMS.
- These fields drive the hero image at the top of the post and also use Next.js image optimization.

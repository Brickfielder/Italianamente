import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".apng": "image/apng",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const resolveUploadPath = (relativePath: string) => {
  const projectRoot = process.cwd();
  const mediaRoot = path.join(projectRoot, "uploads");
  const targetPath = path.resolve(mediaRoot, relativePath);

  if (!targetPath.startsWith(mediaRoot)) {
    throw new Error("Invalid upload path.");
  }

  return targetPath;
};

const getContentType = (filePath: string) =>
  CONTENT_TYPE_MAP[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

export async function GET(
  _request: Request,
  { params }: { params: { path?: string[] } }
) {
  try {
    const relativePath = decodeURIComponent(params.path?.join("/") ?? "");
    if (!relativePath) {
      return NextResponse.json({ message: "Missing upload path." }, { status: 400 });
    }

    const targetPath = resolveUploadPath(relativePath);
    const fileBuffer = await fs.readFile(targetPath);
    const contentType = getContentType(targetPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload not found.";
    return NextResponse.json({ message }, { status: 404 });
  }
}

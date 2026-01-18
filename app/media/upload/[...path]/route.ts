import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import busboy from "busboy";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;

const getResizeTarget = () => {
  const maxWidth = Number(process.env.TINA_IMAGE_MAX_WIDTH ?? DEFAULT_MAX_WIDTH);
  const maxHeight = Number(process.env.TINA_IMAGE_MAX_HEIGHT ?? DEFAULT_MAX_HEIGHT);

  return {
    maxWidth: Number.isFinite(maxWidth) ? maxWidth : DEFAULT_MAX_WIDTH,
    maxHeight: Number.isFinite(maxHeight) ? maxHeight : DEFAULT_MAX_HEIGHT,
  };
};

const resolveUploadPath = (relativePath: string) => {
  const projectRoot = process.cwd();
  const mediaRoot = path.join(projectRoot, "uploads");
  const targetPath = path.resolve(mediaRoot, relativePath);

  if (!targetPath.startsWith(mediaRoot)) {
    throw new Error("Invalid upload path.");
  }

  return { mediaRoot, targetPath };
};

const isImage = (mimeType?: string) => Boolean(mimeType?.startsWith("image/"));

export async function POST(
  request: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!request.body) {
    return NextResponse.json({ message: "Missing upload body." }, { status: 400 });
  }

  const uploadPath = decodeURIComponent(params.path?.join("/") ?? "");
  const { maxWidth, maxHeight } = getResizeTarget();
  const fileWrites: Array<Promise<void>> = [];

  const headers = Object.fromEntries(request.headers.entries());
  const bb = busboy({ headers });

  bb.on("file", (_name, file, info) => {
    const buffers: Buffer[] = [];
    const targetRelativePath = uploadPath || info.filename;

    const writePromise = new Promise<void>((resolve, reject) => {
      file.on("data", (data) => {
        buffers.push(Buffer.from(data));
      });

      file.on("error", reject);

      file.on("end", async () => {
        try {
          const { targetPath } = resolveUploadPath(targetRelativePath);
          await fs.mkdir(path.dirname(targetPath), { recursive: true });

          const fileBuffer = Buffer.concat(buffers);
          let outputBuffer = fileBuffer;

          if (isImage(info.mimeType)) {
            outputBuffer = await sharp(fileBuffer)
              .rotate()
              .resize({
                width: maxWidth,
                height: maxHeight,
                fit: "inside",
                withoutEnlargement: true,
              })
              .toBuffer();
          }

          await fs.writeFile(targetPath, outputBuffer);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    fileWrites.push(writePromise);
  });

  const finished = new Promise<void>((resolve, reject) => {
    bb.on("finish", () => resolve());
    bb.on("error", reject);
  });

  Readable.fromWeb(request.body).pipe(bb);

  try {
    await finished;
    await Promise.all(fileWrites);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

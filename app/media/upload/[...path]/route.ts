import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import busboy from "busboy";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const resolveUploadPath = (relativePath: string) => {
  const publicRoot = path.join(process.cwd(), "public");
  const mediaRoot = path.join(publicRoot, "uploads");
  const targetPath = path.resolve(mediaRoot, relativePath);

  if (!targetPath.startsWith(mediaRoot)) {
    throw new Error("Invalid upload path.");
  }

  return { mediaRoot, targetPath };
};

export async function POST(
  request: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!request.body) {
    return NextResponse.json({ message: "Missing upload body." }, { status: 400 });
  }

  const uploadPath = decodeURIComponent(params.path?.join("/") ?? "");
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
          await fs.writeFile(targetPath, fileBuffer);
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

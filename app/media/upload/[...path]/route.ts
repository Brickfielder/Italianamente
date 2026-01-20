import fs from "node:fs/promises";
import path from "node:path";
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
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing upload file." }, { status: 400 });
  }

  const uploadPath = decodeURIComponent(params.path?.join("/") ?? "");
  const directoryField = formData.get("directory");
  const filenameField = formData.get("filename");
  const directory = typeof directoryField === "string" ? directoryField : "";
  const filename = typeof filenameField === "string" && filenameField.length > 0 ? filenameField : file.name;
  const relativePath = uploadPath || path.join(directory, filename);

  try {
    const { targetPath } = resolveUploadPath(relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, fileBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

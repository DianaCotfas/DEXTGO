import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildR2Key, uploadToR2 } from "@/lib/r2";
import { isConfigured } from "@/lib/env";

export const runtime = "nodejs";
const MB = 1024 * 1024;
const MAX_IMAGE_MB = 12;
const MAX_VIDEO_MB = 120;
const MAX_OTHER_MB = 25;

export async function POST(request: NextRequest) {
  await requireAdmin();

  if (!isConfigured("r2")) {
    return NextResponse.json(
      {
        code: "not-configured",
        message:
          "R2 is not connected yet. Add R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) to .env.local and the uploader will go live.",
      },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const prefix = (form?.get("prefix") ?? "uploads").toString();
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ code: "no-file" }, { status: 400 });
  }
  const filename = (file as File).name ?? "upload.bin";
  const contentType = file.type || "application/octet-stream";
  const isVideo = contentType.startsWith("video/");
  const isImage = contentType.startsWith("image/");
  const maxBytes = isVideo
    ? MAX_VIDEO_MB * MB
    : isImage
      ? MAX_IMAGE_MB * MB
      : MAX_OTHER_MB * MB;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        code: "file-too-large",
        message: `File is too large. Max allowed size is ${Math.floor(maxBytes / MB)}MB.`,
      },
      { status: 413 },
    );
  }
  const buffer = new Uint8Array(await file.arrayBuffer());
  const key = buildR2Key(prefix, filename);

  const result = await uploadToR2({ key, body: buffer, contentType });
  return NextResponse.json(result);
}

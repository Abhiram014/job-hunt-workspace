import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storageProvider } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resume || !resume.fileURL) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await storageProvider.read(resume.fileURL);
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const download = new URL(req.url).searchParams.get("download") === "1";
  const contentType = CONTENT_TYPES[resume.fileType ?? "txt"] ?? "application/octet-stream";
  const safeName = resume.name.replace(/[^a-zA-Z0-9 _.-]/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}.${resume.fileType}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

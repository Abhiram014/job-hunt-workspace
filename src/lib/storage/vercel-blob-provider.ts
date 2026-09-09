import { randomUUID } from "crypto";
import path from "path";
import { put, get, del } from "@vercel/blob";
import type { StorageProvider, StoredFile } from "./provider";

function extname(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return [".pdf", ".docx", ".doc", ".txt"].includes(ext) ? ext : "";
}

// Production storage backend. The store is private — reads require the
// server's BLOB_READ_WRITE_TOKEN (via the SDK's get()), so a leaked blob URL
// alone can't serve the file. Always accessed through an authenticated route
// (see /api/resumes/[id]/file) that checks resume ownership first regardless.
export class VercelBlobStorageProvider implements StorageProvider {
  async save(params: {
    userId: string;
    fileName: string;
    contentType: string;
    data: Buffer;
  }): Promise<StoredFile> {
    const pathname = `resumes/${params.userId}/${randomUUID()}${extname(params.fileName)}`;
    const blob = await put(pathname, params.data, {
      access: "private",
      addRandomSuffix: true,
      contentType: params.contentType,
    });
    return { key: blob.url, bytes: params.data.length };
  }

  async read(key: string): Promise<Buffer> {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new Error("File not found in blob storage");
    }
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await del(key).catch(() => {});
  }
}

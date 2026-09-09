import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import type { StorageProvider, StoredFile } from "./provider";

const ROOT = path.join(process.cwd(), "storage", "resumes");

function extname(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  // Only allow a small known set of extensions on disk; anything else is dropped.
  return [".pdf", ".docx", ".doc", ".txt"].includes(ext) ? ext : "";
}

export class LocalStorageProvider implements StorageProvider {
  async save(params: {
    userId: string;
    fileName: string;
    contentType: string;
    data: Buffer;
  }): Promise<StoredFile> {
    const userDir = path.join(ROOT, params.userId);
    await fs.mkdir(userDir, { recursive: true });

    const safeName = `${randomUUID()}${extname(params.fileName)}`;
    const filePath = path.join(userDir, safeName);
    await fs.writeFile(filePath, params.data);

    // Key is userId/filename so ownership can be checked without hitting disk.
    return { key: `${params.userId}/${safeName}`, bytes: params.data.length };
  }

  async read(key: string): Promise<Buffer> {
    const resolved = this.resolve(key);
    return fs.readFile(resolved);
  }

  async delete(key: string): Promise<void> {
    const resolved = this.resolve(key);
    await fs.rm(resolved, { force: true });
  }

  private resolve(key: string): string {
    const resolved = path.join(ROOT, key);
    if (!resolved.startsWith(ROOT)) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }
}

export const storageProvider = new LocalStorageProvider();

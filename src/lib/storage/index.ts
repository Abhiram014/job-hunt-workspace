import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local-provider";
import { VercelBlobStorageProvider } from "./vercel-blob-provider";

// Vercel injects BLOB_READ_WRITE_TOKEN automatically once a Blob store is
// connected to the project. Falls back to local disk for local dev.
export const storageProvider: StorageProvider = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorageProvider()
  : new LocalStorageProvider();

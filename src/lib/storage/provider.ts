export interface StoredFile {
  key: string;
  bytes: number;
}

// Abstraction so local disk storage can be swapped for Supabase Storage / S3
// later without touching call sites.
export interface StorageProvider {
  save(params: {
    userId: string;
    fileName: string;
    contentType: string;
    data: Buffer;
  }): Promise<StoredFile>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

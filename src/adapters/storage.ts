/**
 * Storage Adapter Interface
 *
 * Abstraction for file storage (images, documents, etc.)
 */

export interface UploadOptions {
  filename: string;
  content: Buffer | NodeJS.ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface StorageFile {
  key: string;
  url: string;
  size: number;
  contentType?: string;
  uploadedAt: Date;
}

export interface IStorageAdapter {
  upload(options: UploadOptions): Promise<StorageFile>;
  download(key: string): Promise<{ content: Buffer; contentType?: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string, expiresIn?: number): Promise<string>;
  list(prefix?: string): Promise<StorageFile[]>;
}

/**
 * In-memory storage adapter for development/testing
 */
export class InMemoryStorageAdapter implements IStorageAdapter {
  private files: Map<string, { content: Buffer; contentType?: string; metadata?: Record<string, string>; uploadedAt: Date }> = new Map();

  async upload(options: UploadOptions): Promise<StorageFile> {
    const key = `${Date.now()}-${options.filename}`;

    let content: Buffer;
    if (Buffer.isBuffer(options.content)) {
      content = options.content;
    } else {
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of options.content) {
        chunks.push(Buffer.from(chunk));
      }
      content = Buffer.concat(chunks);
    }

    this.files.set(key, {
      content,
      contentType: options.contentType,
      metadata: options.metadata,
      uploadedAt: new Date(),
    });

    return {
      key,
      url: `/storage/${key}`,
      size: content.length,
      contentType: options.contentType,
      uploadedAt: new Date(),
    };
  }

  async download(key: string): Promise<{ content: Buffer; contentType?: string }> {
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }

    return {
      content: file.content,
      contentType: file.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async getUrl(key: string, expiresIn?: number): Promise<string> {
    if (!this.files.has(key)) {
      throw new Error(`File not found: ${key}`);
    }
    return `/storage/${key}${expiresIn ? `?expires=${Date.now() + expiresIn * 1000}` : ''}`;
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    const results: StorageFile[] = [];

    for (const [key, file] of this.files.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        results.push({
          key,
          url: `/storage/${key}`,
          size: file.content.length,
          contentType: file.contentType,
          uploadedAt: file.uploadedAt,
        });
      }
    }

    return results;
  }

  // Helper method for testing
  clear(): void {
    this.files.clear();
  }
}

/**
 * Stub adapter for S3/cloud storage (placeholder)
 */
export class CloudStorageAdapter implements IStorageAdapter {
  constructor(
    private config: {
      bucket: string;
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    }
  ) {}

  async upload(options: UploadOptions): Promise<StorageFile> {
    throw new Error('CloudStorageAdapter not implemented. Please implement S3/GCS/Azure Blob integration.');
  }

  async download(key: string): Promise<{ content: Buffer; contentType?: string }> {
    throw new Error('CloudStorageAdapter not implemented. Please implement S3/GCS/Azure Blob integration.');
  }

  async delete(key: string): Promise<void> {
    throw new Error('CloudStorageAdapter not implemented. Please implement S3/GCS/Azure Blob integration.');
  }

  async getUrl(key: string, expiresIn?: number): Promise<string> {
    throw new Error('CloudStorageAdapter not implemented. Please implement S3/GCS/Azure Blob integration.');
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    throw new Error('CloudStorageAdapter not implemented. Please implement S3/GCS/Azure Blob integration.');
  }
}

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { env } from '../config/env';

let client: S3Client | null = null;

/**
 * Phase 5 of the Supabase->Neon migration: Cloudflare R2 (S3-compatible)
 * replaces Supabase Storage. R2's public dev URL serves the bucket directly,
 * so uploads just need a stable key — no signed URLs, unlike the old
 * Supabase implementation this replaces.
 */
function getClient(): S3Client {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) {
    throw new Error('R2 storage is not configured (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME/R2_PUBLIC_URL).');
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export class StorageService {
  /**
   * Uploads a file buffer to R2 and returns its public URL. `bucket` is one
   * of the app's logical buckets (chef-photos/chat-media/kitchen-media/
   * chef-documents, see media.controller.ts#ALLOWED_BUCKETS) — these used to
   * be separate Supabase Storage buckets, and are now folder prefixes inside
   * the single real R2 bucket (R2_BUCKET_NAME) instead, which needs only one
   * bucket/credential set to manage rather than four.
   */
  static async uploadFile(
    bucket: string,
    folder: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<string> {
    const isImage = mimeType.startsWith('image/');
    let uploadBuffer = fileBuffer;
    let finalMimeType = mimeType;
    let fileExt = originalName.split('.').pop()?.toLowerCase() || '';

    // Optimize images
    if (isImage) {
      uploadBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      finalMimeType = 'image/webp';
      fileExt = 'webp';
    }

    const key = `${bucket}/${folder}/${uuidv4()}.${fileExt}`;

    await getClient().send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: uploadBuffer,
      ContentType: finalMimeType,
      CacheControl: 'public, max-age=31536000',
    }));

    return this.getPublicUrl(key);
  }

  static getPublicUrl(key: string): string {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }

  /**
   * `path` may be the full public URL (kitchen.controller.ts stores and
   * passes the whole thing) or just the relative key within `bucket`
   * (profile.tsx strips the bucket prefix client-side before calling
   * DELETE /media) — both conventions already existed under the old
   * Supabase implementation this replaces, so both are handled here too.
   */
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    let relativePath = path;
    if (env.R2_PUBLIC_URL && path.startsWith(env.R2_PUBLIC_URL)) {
      relativePath = path.slice(env.R2_PUBLIC_URL.length).replace(/^\//, '');
    }
    const key = relativePath.startsWith(`${bucket}/`) ? relativePath : `${bucket}/${relativePath}`;

    await getClient().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key }));
    return true;
  }
}

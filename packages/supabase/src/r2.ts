import { supabase } from "./integrations/supabase/client";

const PUBLIC_BUCKETS = ["avatars", "shop-logos", "product-images", "brand-assets", "talent-assets"];

export interface R2PresignedResponse {
  url: string;
  publicUrl?: string;
}

/**
 * Requests a presigned URL from the Supabase edge function `r2-storage`
 */
export async function getR2PresignedUrl(
  bucket: string,
  key: string,
  action: "upload" | "download",
  contentType?: string
): Promise<R2PresignedResponse> {
  const { data, error } = await supabase.functions.invoke("r2-storage", {
    body: { bucket, key, action, contentType },
  });

  if (error || !data) {
    throw new Error(error?.message || "Failed to generate presigned R2 URL");
  }

  return data as R2PresignedResponse;
}

/**
 * Uploads a file (or Blob) directly to Cloudflare R2 via presigned PUT URL.
 * Returns the final URL or key:
 * - For public buckets, returns the direct public CDN URL.
 * - For private buckets, returns the key path (since it needs GET presigning to view).
 */
export async function uploadFileToR2(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string }
): Promise<string> {
  const contentType = options?.contentType || file.type || "application/octet-stream";
  
  // 1. Get the PUT presigned URL from edge function
  const { url, publicUrl } = await getR2PresignedUrl(bucket, path, "upload", contentType);

  // 2. Perform direct upload to R2
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to Cloudflare R2: ${response.statusText}`);
  }

  // 3. Return target address
  if (PUBLIC_BUCKETS.includes(bucket)) {
    return publicUrl || getPublicUrlFromR2(bucket, path);
  }
  
  return path; // Private files return their key/path
}

/**
 * Generates a public CDN access URL client-side for public buckets.
 */
export function getPublicUrlFromR2(bucket: string, path: string): string {
  const prefix = import.meta.env.VITE_R2_PUBLIC_URL_PREFIX || "https://pub-placeholder.r2.dev";
  return `${prefix}/${bucket}/${path}`;
}

/**
 * Requests a secure, temporary GET presigned URL for private buckets.
 */
export async function getSignedUrlFromR2(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { url } = await getR2PresignedUrl(bucket, path, "download");
  return url;
}

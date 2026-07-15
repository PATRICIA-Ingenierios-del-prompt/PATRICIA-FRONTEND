import type { PictureUploadResponse } from '../types/patricia';

/**
 * Direct-to-S3 upload for the presigned-POST flow (Parches/Events pictures).
 * Submit the signed `fields` first, then the file (field name "file", last).
 * This goes straight to S3, NOT the gateway — no Authorization header.
 * Resolves to the public URL to store as pictureUrl.
 */
export async function uploadToPresignedPost(
  presigned: PictureUploadResponse,
  file: File | Blob,
): Promise<string> {
  const form = new FormData();
  for (const [k, v] of Object.entries(presigned.fields)) form.append(k, v);
  form.append('file', file);
  const res = await fetch(presigned.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`S3 upload failed (${res.status})`);
  return presigned.publicUrl;
}

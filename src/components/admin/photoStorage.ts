/**
 * Helpers for the equipment-photos Supabase Storage bucket.
 * Folder layout maps each catalog table to a friendlier folder name.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const PHOTO_BUCKET = 'equipment-photos';

export const STORAGE_FOLDER_BY_TABLE: Record<string, string> = {
  profiles: 'profiles',
  bum_models: 'bum_models',
  accessories: 'accessories',
  pumps: 'pumps',
  wash_functions: 'wash_functions',
  water_treatment: 'water',
  extra_equipment: 'extra',
  robot_models: 'robots',
  bur_models: 'burs',
  truck_wash_types: 'trucks',
};

/** Strip the cache-buster query and the public URL prefix to get the storage path. */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const tail = url.slice(i + marker.length);
  const q = tail.indexOf('?');
  return q >= 0 ? tail.slice(0, q) : tail;
}

export function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  // Fallback from MIME (e.g. image/jpeg → jpeg)
  const fromMime = file.type.split('/').pop();
  return (fromMime ?? 'jpg').toLowerCase();
}

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload a photo, replacing any previous photo at the table/id slot
 * (handles extension changes by deleting the previous file first).
 */
export async function uploadPhoto(
  supabase: SupabaseClient,
  table: string,
  id: string,
  file: File,
  previousUrl: string | null,
): Promise<UploadResult> {
  const folder = STORAGE_FOLDER_BY_TABLE[table];
  if (!folder) throw new Error(`Unknown table for photo storage: ${table}`);

  const ext = fileExtension(file);
  const path = `${folder}/${id}.${ext}`;

  if (previousUrl) {
    const prevPath = pathFromPublicUrl(previousUrl);
    if (prevPath && prevPath !== path) {
      await supabase.storage.from(PHOTO_BUCKET).remove([prevPath]);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: '3600',
    });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  // Cache-buster so swapped photos don't show the old cached image
  return { publicUrl: `${publicUrl}?v=${Date.now()}`, path };
}

export async function removePhoto(
  supabase: SupabaseClient,
  url: string | null,
): Promise<void> {
  if (!url) return;
  const path = pathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

/**
 * Helpers for resolving and pre-fetching the photos that should be embedded
 * in PDF/Excel KP exports. Only items marked `show_image_in_kp` and present
 * in the user's current configuration get included.
 */

import type { WizardState } from '@/types';
import type { DataContextValue } from '@/context/DataContext';

export interface KpPhoto {
  url: string;
  label: string;
  price: number;
}

/**
 * Walks the current wizard state and returns the photos that should appear
 * in the KP — only headline items per branch (profile, bum, robot, bur,
 * truck wash type, osmos, vacuum). Skips items without `showImageInKp`.
 */
export function collectKpPhotos(state: WizardState, data: DataContextValue): KpPhoto[] {
  const photos: KpPhoto[] = [];
  const seen = new Set<string>();

  const add = (url: string | undefined, flag: boolean | undefined, label: string, price: number) => {
    if (!url || !flag) return;
    if (seen.has(url)) return;
    seen.add(url);
    photos.push({ url, label, price });
  };

  if (state.step1.objectType === 'truck') {
    const truck = data.truckWashTypes.find((t) => t.id === state.truckStep2.selectedType);
    if (truck) add(truck.imageUrl, truck.showImageInKp, truck.name, truck.price);
    const bur = data.burModels.find((b) => b.id === state.truckBur.burModel);
    if (bur) add(bur.imageUrl, bur.showImageInKp, bur.name, bur.price);
  } else if (state.step1.objectType === 'robotic') {
    const robot = data.robotModels.find((m) => m.id === state.robotStep2.robotModel);
    if (robot) add(robot.imageUrl, robot.showImageInKp, robot.name, robot.price);
    const bur = data.burModels.find((b) => b.id === state.robotStep3.burModel);
    if (bur) add(bur.imageUrl, bur.showImageInKp, bur.name, bur.price);
  } else {
    // MSO: per-post profile + bum
    for (const post of state.posts.length > 0 ? state.posts : []) {
      const profile = data.profiles.find((p) => p.id === post.profile);
      if (profile) add(profile.imageUrl, profile.showImageInKp, profile.name, profile.price);
      const bum = data.bumModels.find((b) => b.id === post.bumModel);
      if (bum) add(bum.imageUrl, bum.showImageInKp, bum.name, bum.realPrice);
    }
    // Also include current draft if no saved posts
    if (state.posts.length === 0) {
      const profile = data.profiles.find((p) => p.id === state.step2.profile);
      if (profile) add(profile.imageUrl, profile.showImageInKp, profile.name, profile.price);
      const bum = data.bumModels.find((b) => b.id === state.step3.bumModel);
      if (bum) add(bum.imageUrl, bum.showImageInKp, bum.name, bum.realPrice);
    }
  }

  // Common: osmos + vacuum (apply to MSO and robot)
  if (state.step1.objectType !== 'truck') {
    const osmos = data.osmosOptions.find((o) => o.id === state.step7.osmosOption);
    if (osmos) add(osmos.imageUrl, osmos.showImageInKp, osmos.name, osmos.price);
    const vac = data.vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
    if (vac && vac.id !== 'none') add(vac.imageUrl, vac.showImageInKp, vac.name, vac.price);
  }

  return photos;
}

/**
 * Fetches each image URL once into a base64 data URL. Times out after 5s per
 * image. Failed fetches are silently dropped — the caller skips embedding
 * for missing entries.
 */
export async function fetchPhotosAsBase64(
  urls: string[],
): Promise<Map<string, string>> {
  const results = await Promise.all(urls.map(async (url) => {
    const data = await fetchOne(url);
    return [url, data] as const;
  }));
  const map = new Map<string, string>();
  for (const [url, data] of results) {
    if (data) map.set(url, data);
  }
  return map;
}

async function fetchOne(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

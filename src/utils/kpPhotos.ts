/**
 * Helpers for resolving and pre-fetching the photos that should be embedded
 * in PDF/Excel KP exports. Includes every catalog row that
 *   • is referenced by the current configuration (selected accessory,
 *     used pump, picked osmos, etc.) AND
 *   • has an `image_url` AND
 *   • has the `show_image_in_kp` flag set in the admin.
 */

import type { WizardState } from '@/types';
import type { DataContextValue } from '@/context/DataContext';

export interface KpPhoto {
  url: string;
  label: string;
  price: number;
}

/**
 * Walks the current wizard state, resolves every referenced catalog row
 * against the live DataContext, and returns one entry per row that's both
 * marked "В КП" and carries an image. Deduplicated by URL so an item
 * referenced by multiple posts shows up once.
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
    // ── Truck branch ─────────────────────────────────────────────────────
    const truck = data.truckWashTypes.find((t) => t.id === state.truckStep2.selectedType);
    if (truck) add(truck.imageUrl, truck.showImageInKp, truck.name, truck.price);

    const bur = data.burModels.find((b) => b.id === state.truckBur.burModel);
    if (bur) add(bur.imageUrl, bur.showImageInKp, bur.name, bur.price);

    return photos;
  }

  if (state.step1.objectType === 'robotic') {
    // ── Robot branch ─────────────────────────────────────────────────────
    const robot = data.robotModels.find((m) => m.id === state.robotStep2.robotModel);
    if (robot) add(robot.imageUrl, robot.showImageInKp, robot.name, robot.price);

    const bur = data.burModels.find((b) => b.id === state.robotStep3.burModel);
    if (bur) add(bur.imageUrl, bur.showImageInKp, bur.name, bur.price);

    addWaterAndWashExtras(state, data, add);
    return photos;
  }

  // ── MSO branch ───────────────────────────────────────────────────────
  // For each post (or the current draft if no posts saved yet) collect
  // profile + bum + selected accessories + selected pumps + active functions
  const posts = state.posts.length > 0 ? state.posts : [];
  if (posts.length === 0) {
    // Treat the in-progress draft as a single post
    addPostHeadlines(state.step2.profile, state.step3.bumModel, data, add);
    addAccessories(state.step2.accessories.filter((a) => a.selected).map((a) => a.id), data, add);
    addPumps(state.step5.avdSelections.map((s) => s.avdId).filter(Boolean), data, add);
    addFunctions(state.step4.functions, data, add);
  } else {
    for (const post of posts) {
      addPostHeadlines(post.profile, post.bumModel, data, add);
      addAccessories(post.accessories.filter((a) => a.selected).map((a) => a.id), data, add);
      addPumps(post.avdSelections.map((s) => s.avdId).filter(Boolean), data, add);
      addFunctions(post.functions, data, add);
    }
  }

  // Post extras (Step 8) — these are wizard-level, not per-post
  for (const e of state.step8.extras) {
    if (!e.selected) continue;
    const cat = data.defaultPostExtras.find((p) => p.id === e.id);
    if (cat) add(cat.imageUrl, cat.showImageInKp, cat.name, cat.price);
  }

  addWaterAndWashExtras(state, data, add);
  return photos;
}

// ─── Per-section helpers ────────────────────────────────────────────────────

type Adder = (url: string | undefined, flag: boolean | undefined, label: string, price: number) => void;

function addPostHeadlines(profileId: string, bumId: string, data: DataContextValue, add: Adder) {
  const profile = data.profiles.find((p) => p.id === profileId);
  if (profile) add(profile.imageUrl, profile.showImageInKp, profile.name, profile.price);

  const bum = data.bumModels.find((b) => b.id === bumId);
  if (bum) add(bum.imageUrl, bum.showImageInKp, bum.name, bum.realPrice);
}

function addAccessories(ids: string[], data: DataContextValue, add: Adder) {
  for (const id of ids) {
    const acc = data.defaultAccessories.find((a) => a.id === id);
    if (acc) add(acc.imageUrl, acc.showImageInKp, acc.name, acc.price);
  }
}

function addPumps(ids: string[], data: DataContextValue, add: Adder) {
  for (const id of ids) {
    const pump = data.avdKits.find((p) => p.id === id);
    if (pump) add(pump.imageUrl, pump.showImageInKp, pump.name, pump.price);
  }
}

function addFunctions(
  fns: WizardState['step4']['functions'],
  data: DataContextValue,
  add: Adder,
) {
  const allFns = [...data.defaultBaseFunctions, ...data.defaultExtraFunctions];
  for (const f of fns) {
    if (!f.option || f.option === 'none') continue;
    const dbFn = allFns.find((d) => d.id === f.id);
    if (dbFn) add(dbFn.imageUrl, dbFn.showImageInKp, dbFn.name, dbFn.kitPrice);
  }
}

function addWaterAndWashExtras(state: WizardState, data: DataContextValue, add: Adder) {
  // Osmos
  const osmos = data.osmosOptions.find((o) => o.id === state.step7.osmosOption);
  if (osmos) add(osmos.imageUrl, osmos.showImageInKp, osmos.name, osmos.price);

  // ARAS
  const aras = data.arasModels.find((a) => a.id === state.step7.arasModel);
  if (aras && 'price' in aras && typeof aras.price === 'number') {
    add(aras.imageUrl, aras.showImageInKp, aras.name, aras.price);
  }

  // Vacuum
  const vac = data.vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  if (vac && vac.id !== 'none') add(vac.imageUrl, vac.showImageInKp, vac.name, vac.price);

  // Wash extras (Step 9)
  for (const e of state.step9.extras) {
    if (!e.selected) continue;
    const cat = data.defaultWashExtras.find((w) => w.id === e.id);
    if (cat) add(cat.imageUrl, cat.showImageInKp, cat.name, cat.price);
  }
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

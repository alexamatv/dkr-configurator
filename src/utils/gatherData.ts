import type { WizardState, PostConfig } from '@/types';
import {
  profiles,
  bumModels,
  paymentSystemLabels,
  paymentSystemPrices,
  avdKits,
  osmosOptions,
  arasModels,
  vacuumOptions,
  dosatorOptions,
  managers,
} from '@/data/mockData';

export interface PostRow {
  name: string;
  price: number;
}

export interface PostBlock {
  title: string;
  profileName: string;
  basePrice: number;
  bumName: string;
  bumPrice: number;
  payments: PostRow[];
  accessories: PostRow[];
  functions: PostRow[];
  pumps: PostRow[];
  postExtras: PostRow[];
  secondPump: PostRow | null;
  postTotal: number;
}

export interface WashBlock {
  waterLabel: string;
  waterPrice: number;
  vacuumLabel: string;
  vacuumPrice: number;
  extras: PostRow[];
  pipelines: { air: number; water: number; chem: number };
  washTotal: number;
}

export interface TotalsBlock {
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  afterDiscount: number;
  montageType: string;
  montageFromSubtotal: number;
  montageExtra: number;
  montageAmount: number;
  vatEnabled: boolean;
  vatPct: number;
  vatBase: number;
  vatAmount: number;
  total: number;
}

export interface HeaderData {
  date: string;
  manager: string;
  client: string;
  vehicleType: string;
  objectType: string;
  region: string;
  currency: string;
}

export interface DocData {
  header: HeaderData;
  posts: PostBlock[];
  wash: WashBlock;
  totals: TotalsBlock;
  deliveryConditions: string;
  paymentConditions: string;
}

function getPostName(post: PostConfig, idx: number): string {
  if (post.customName) return post.customName;
  const profile = profiles.find((p) => p.id === post.profile);
  return `Пост #${idx + 1} — ${profile?.name ?? 'Без профиля'}`;
}

function calcPostBlock(post: PostConfig, idx: number, state: WizardState): PostBlock {
  const profile = profiles.find((p) => p.id === post.profile);
  const basePrice = profile?.basePrice ?? 0;

  const bum = bumModels.find((b) => b.id === post.bumModel);
  const bumName = bum?.name ?? '—';
  const bumPrice = bum?.price ?? 0;

  const payments: PostRow[] = post.paymentSystems.map((ps) => ({
    name: paymentSystemLabels[ps] ?? ps,
    price: paymentSystemPrices[ps] ?? 0,
  }));

  const accessories: PostRow[] = post.accessories
    .filter((a) => a.selected)
    .map((a) => ({
      name: a.name,
      price: a.customPrice !== undefined ? a.customPrice : a.price,
    }));

  const functions: PostRow[] = post.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .map((f) => {
      let price = 0;
      let suffix = '';
      if (f.option === 'button_only') price = f.buttonPrice;
      else if (f.option === 'button_and_kit') price = f.buttonPrice + f.kitPrice;
      if (f.requiresDosator && f.selectedDosator) {
        const dos = dosatorOptions.find((d) => d.id === f.selectedDosator);
        if (dos) {
          price += dos.price;
          suffix = ` (${dos.name})`;
        }
      }
      return { name: f.name + suffix, price };
    });

  const pumps: PostRow[] = post.avdSelections.map((sel) => {
    const kit = avdKits.find((a) => a.id === sel.avdId);
    return {
      name: kit?.name?.replace(' (входит в комплект)', '') ?? '—',
      price: kit?.price ?? 0,
    };
  });
  if (state.step5.customPumpPrice && state.step5.customPumpPrice > 0) {
    pumps.push({ name: 'Доп. помпа (ручной ввод)', price: state.step5.customPumpPrice });
  }

  const postExtras: PostRow[] = state.step8.extras
    .filter((e) => e.selected)
    .map((e) => ({ name: e.name + (e.quantity > 1 ? ` x${e.quantity}` : ''), price: e.price * e.quantity }));

  let secondPump: PostRow | null = null;
  if (state.step8.secondPumpEnabled) {
    const defaultSel = state.step5.avdSelections.find((s) => s.isDefault);
    const defaultAvd = defaultSel ? avdKits.find((k) => k.id === defaultSel.avdId) : null;
    const spPrice = defaultAvd ? (defaultAvd.price > 0 ? defaultAvd.price : 85000) : 0;
    const spName = defaultAvd?.name?.replace(' (входит в комплект)', '') ?? '—';
    secondPump = { name: `Вторая помпа — ${spName}`, price: spPrice };
  }

  const accTotal = accessories.reduce((s, r) => s + r.price, 0);
  const payTotal = payments.reduce((s, r) => s + r.price, 0);
  const funTotal = functions.reduce((s, r) => s + r.price, 0);
  const pmpTotal = pumps.reduce((s, r) => s + r.price, 0);
  const extTotal = postExtras.reduce((s, r) => s + r.price, 0);
  const spTotal = secondPump?.price ?? 0;
  const postTotal = basePrice + accTotal + bumPrice + payTotal + funTotal + pmpTotal + extTotal + spTotal;

  return {
    title: getPostName(post, idx),
    profileName: profile?.name ?? '—',
    basePrice,
    bumName,
    bumPrice,
    payments,
    accessories,
    functions,
    pumps,
    postExtras,
    secondPump,
    postTotal,
  };
}

export function gatherDocData(state: WizardState): DocData {
  const mgr = managers.find((m) => m.id === state.step1.manager);

  const header: HeaderData = {
    date: new Date().toLocaleDateString('ru-RU'),
    manager: mgr?.name ?? (state.step1.manager || '—'),
    client: state.step1.clientSearch || '—',
    vehicleType: state.step1.vehicleType === 'passenger' ? 'Легковой (коммерческий)' : 'Грузовой',
    objectType: state.step1.objectType === 'self_service' ? 'Мойка самообслуживания' : 'Роботизированная мойка',
    region: state.step10.region || '—',
    currency: state.step10.currency,
  };

  const postsData = state.posts.length > 0 ? state.posts : [];
  const postBlocks = postsData.map((p, i) => calcPostBlock(p, i, state));

  // Wash block
  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;
  const customWater = state.step7.customWaterPrice || 0;

  let waterLabel = '—';
  let waterPrice = 0;
  if (osmos) {
    waterLabel = `Осмос: ${osmos.name}`;
    waterPrice = osmos.price;
  }
  if (aras && aras.id !== 'none') {
    waterLabel += (waterLabel !== '—' ? ' + ' : '') + `ARAS: ${aras.name}`;
    waterPrice += arasPrice;
  }
  if (customWater > 0) {
    waterLabel += (waterLabel !== '—' ? ' + ' : '') + 'Ручной ввод';
    waterPrice += customWater;
  }
  if (!osmos && (!aras || aras.id === 'none') && customWater === 0) {
    waterLabel = 'Клиент докупит самостоятельно';
  }

  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacPrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;
  const vacLabel = vac && vac.id !== 'none'
    ? `${vac.name} x${state.step9.vacuumQuantity}`
    : 'Нет';

  const washExtras: PostRow[] = state.step9.extras
    .filter((e) => e.selected)
    .map((e) => ({ name: e.name + (e.quantity > 1 ? ` x${e.quantity}` : ''), price: e.price * e.quantity }));

  const pipAir = state.step9.pipelinesAirPrice || 0;
  const pipWater = state.step9.pipelinesWaterPrice || 0;
  const pipChem = state.step9.pipelinesChemPrice || 0;

  const washTotal = waterPrice + vacPrice
    + washExtras.reduce((s, r) => s + r.price, 0)
    + pipAir + pipWater + pipChem;

  const wash: WashBlock = {
    waterLabel,
    waterPrice,
    vacuumLabel: vacLabel,
    vacuumPrice: vacPrice,
    extras: washExtras,
    pipelines: { air: pipAir, water: pipWater, chem: pipChem },
    washTotal,
  };

  // Totals — mirror CostPanel logic
  const postCount = Math.max(postBlocks.length, 1);
  const equipmentTotal = postBlocks.reduce((s, p) => s + p.postTotal, 0);
  // secondPump and postExtras are already in postTotal above,
  // but CostPanel adds them to washTotal. Let's match CostPanel exactly:
  // CostPanel: subtotal = equipmentTotal(kitPrice+upgradesPerPost)*postCount + washTotal
  // Our postBlocks include postExtras+secondPump per-post but CostPanel puts them in washTotal.
  // To match CostPanel, recalculate subtotal the same way.

  const profileObj = profiles.find((p) => p.id === state.step2.profile);
  const cpBasePrice = profileObj?.basePrice ?? 0;
  const cpAccPrice = state.step2.accessories.filter((a) => a.selected)
    .reduce((s, a) => s + (a.customPrice !== undefined ? a.customPrice : a.price), 0);
  const cpKitPrice = cpBasePrice + cpAccPrice;
  const cpBumUpgrade = bumModels.find((b) => b.id === state.step3.bumModel)?.price ?? 0;
  const cpPayUpgrade = state.step3.paymentSystems.reduce((s, ps) => s + (paymentSystemPrices[ps] ?? 0), 0);
  const cpFuncPrice = state.step4.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .reduce((s, f) => {
      let p = 0;
      if (f.option === 'button_only') p = f.buttonPrice;
      else if (f.option === 'button_and_kit') p = f.buttonPrice + f.kitPrice;
      if (f.requiresDosator && f.selectedDosator) p += dosatorOptions.find((d) => d.id === f.selectedDosator)?.price ?? 0;
      return s + p;
    }, 0);
  const cpAvdUpgrade = state.step5.avdSelections.reduce((s, sel) => {
    return s + (avdKits.find((a) => a.id === sel.avdId)?.price ?? 0);
  }, 0) + (state.step5.customPumpPrice || 0);

  let cpSecondPumpPrice = 0;
  if (state.step8.secondPumpEnabled) {
    const ds = state.step5.avdSelections.find((s2) => s2.isDefault);
    const da = ds ? avdKits.find((k) => k.id === ds.avdId) : null;
    cpSecondPumpPrice = da ? (da.price > 0 ? da.price : 85000) : 0;
  }
  const cpPostExtras = state.step8.extras.filter((e) => e.selected).reduce((s, e) => s + e.price * e.quantity, 0) + cpSecondPumpPrice;
  const cpOsmosPrice = osmos?.price ?? 0;
  const cpWashExtras = state.step9.extras.filter((e) => e.selected).reduce((s, e) => s + e.price * e.quantity, 0);
  const cpPipelines = pipAir + pipWater + pipChem;

  const cpUpgradesPerPost = cpBumUpgrade + cpPayUpgrade + cpFuncPrice + cpAvdUpgrade;
  const cpEquipmentTotal = (cpKitPrice + cpUpgradesPerPost) * postCount;
  const cpWashTotal = cpOsmosPrice + arasPrice + customWater + cpPostExtras + vacPrice + cpWashExtras + cpPipelines;
  const subtotal = cpEquipmentTotal + cpWashTotal;

  const discountPct = state.step10.discount;
  const discountAmount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmount;

  const montage = state.step10.montage;
  const montageRate = montage === 'commissioning' ? 0.05 : montage === 'full' ? 0.1 : 0;
  const montageFromSubtotal = subtotal * montageRate;
  const montageExtra = montage === 'full' ? (state.step10.montageExtra || 0) : 0;
  const montageAmount = montageFromSubtotal + montageExtra;
  const montageTypeLabel = montage === 'full' ? 'Монтаж 10%' : montage === 'commissioning' ? 'Шеф-монтаж 5%' : 'Нет';

  const vatEnabled = state.step10.vatEnabled;
  const vatPct = state.step10.vat;
  const vatBase = afterDiscount + montageAmount;
  const vatAmount = vatEnabled ? vatBase * (vatPct / 100) : 0;
  const total = vatBase + vatAmount;

  const totals: TotalsBlock = {
    subtotal,
    discountPct,
    discountAmount,
    afterDiscount,
    montageType: montageTypeLabel,
    montageFromSubtotal,
    montageExtra,
    montageAmount,
    vatEnabled,
    vatPct,
    vatBase,
    vatAmount,
    total,
  };

  return {
    header,
    posts: postBlocks,
    wash,
    totals,
    deliveryConditions: state.step10.deliveryConditions || '—',
    paymentConditions: state.step10.paymentConditions || '—',
  };
}

export function makeFileName(state: WizardState, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const client = state.step1.clientSearch?.trim();
  const base = client ? `KP_DKR_${date}_${client}` : `KP_DKR_${date}`;
  return base.replace(/[^\w\d_а-яА-ЯёЁ-]/g, '_') + `.${ext}`;
}

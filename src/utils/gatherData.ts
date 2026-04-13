import type { WizardState, PostConfig, PaymentSystem } from '@/types';
import {
  profiles,
  bumModels,
  calcBumPrice,
  getDefaultBumForProfile,
  paymentSystemLabels,
  avdKits,
  osmosOptions,
  arasModels,
  vacuumOptions,
  dosatorOptions,
  managers,
  robotModels,
  burModels,
  calcPaymentCost,
  paymentSystemPrices,
  basePaymentSystems,
  paymentSystemRemovalDiscounts,
  boosterPumpPrice,
  truckWashTypes,
  kompakOptions,
  truckManualPostEquipment,
  truckManualPostMontage,
  truckWaterSystems,
  kompakMontagePrice,
  robotExtraEquipment,
} from '@/data/mockData';

// ─── Shared types ───

export interface PostRow {
  name: string;
  price: number;
}

export interface PostBlock {
  title: string;
  profileName: string;
  basePrice: number;
  includedItems: string[];
  bumName: string;
  bumPrice: number;
  defaultBumName: string;
  bumSwapped: boolean;
  payments: PostRow[];
  accessories: PostRow[];
  baseFunctions: PostRow[];
  functions: PostRow[];
  pumps: PostRow[];
  postExtras: PostRow[];
  secondPump: PostRow | null;
  postTotal: number;
}

export interface WashBlock {
  waterRows: PostRow[];
  waterTotal: number;
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
  discountWarning: boolean;
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
}

export interface RobotBlock {
  modelName: string;
  modelPrice: number;
  includedComponents: string[];
  burName: string;
  burPrice: number;
  options: PostRow[];
  optionsTotal: number;
  extras: PostRow[];
  extrasTotal: number;
  robotTotal: number;
}

export interface TruckBlock {
  typeName: string;
  typePrice: number;
  includedItems: string[];
  burName: string;
  burPrice: number;
  options: PostRow[];
  optionsTotal: number;
  manualPost: PostRow[];
  manualPostMontage: number;
  manualPostTotal: number;
  waterLabel: string;
  waterPrice: number;
  truckTotal: number;
}

export interface DocData {
  isRobot: boolean;
  isTruck: boolean;
  header: HeaderData;
  posts: PostBlock[];
  robot: RobotBlock | null;
  truck: TruckBlock | null;
  wash: WashBlock;
  totals: TotalsBlock;
  deliveryConditions: string;
  paymentConditions: string;
  language: string;
}

// ─── Helpers ───

function getPostName(post: PostConfig, idx: number): string {
  if (post.customName) return post.customName;
  const profile = profiles.find((p) => p.id === post.profile);
  return `Пост #${idx + 1} — ${profile?.name ?? 'Без профиля'}`;
}

// ─── MSO: Post block ───

function calcPostBlock(post: PostConfig, idx: number, state: WizardState): PostBlock {
  const profile = profiles.find((p) => p.id === post.profile);
  const basePrice = profile?.basePrice ?? 0;

  const bum = bumModels.find((b) => b.id === post.bumModel);
  const bumName = bum?.name ?? '—';
  const bumPrice = calcBumPrice(post.bumModel, post.profile);
  const defaultBumId = getDefaultBumForProfile(post.profile);
  const defaultBum = bumModels.find((b) => b.id === defaultBumId);
  const defaultBumName = defaultBum?.name ?? '—';
  const bumSwapped = post.bumModel !== defaultBumId;

  // Payment systems: show all selected + removal discounts for deselected base items
  const payments: PostRow[] = post.paymentSystems.map((ps) => ({
    name: paymentSystemLabels[ps] ?? ps,
    price: paymentSystemPrices[ps] ?? 0,
  }));
  basePaymentSystems
    .filter((ps) => !post.paymentSystems.includes(ps as PaymentSystem))
    .forEach((ps) => {
      const discount = paymentSystemRemovalDiscounts[ps] ?? 0;
      if (discount > 0) {
        payments.push({ name: `${paymentSystemLabels[ps] ?? ps} (снято)`, price: -discount });
      }
    });

  // Accessories (including customPrice)
  const accessories: PostRow[] = post.accessories
    .filter((a) => a.selected)
    .map((a) => ({
      name: a.name,
      price: a.customPrice !== undefined ? a.customPrice : a.price,
    }));

  // Base functions (enabled, входит в комплект)
  const baseFunctions: PostRow[] = post.functions
    .filter((f) => f.isBase && f.enabled)
    .map((f) => ({ name: f.name, price: 0 }));

  // Extra functions with dosator info
  const functions: PostRow[] = post.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .map((f) => {
      let price = 0;
      let suffix = '';
      if (f.option === 'button_only') {
        price = f.buttonPrice;
        suffix = ' (только кнопка)';
      } else if (f.option === 'button_and_kit') {
        price = f.buttonPrice + f.kitPrice;
      }
      if (f.requiresDosator && f.selectedDosator) {
        const dos = dosatorOptions.find((d) => d.id === f.selectedDosator);
        if (dos) {
          price += dos.price;
          suffix = ` (${dos.name})`;
        }
      }
      return { name: f.name + suffix, price };
    });

  // Pumps (АВД)
  const pumps: PostRow[] = post.avdSelections.map((sel) => {
    const kit = avdKits.find((a) => a.id === sel.avdId);
    return {
      name: kit?.name?.replace(' (входит в комплект)', '') ?? '—',
      price: kit?.price ?? 0,
    };
  });
  if (state.step5.customPumpPrice && state.step5.customPumpPrice > 0) {
    pumps.push({ name: 'Дополнительная помпа (ручной ввод)', price: state.step5.customPumpPrice });
  }

  // Post extras (Step 8) — premium included items shown at 0
  const isPremium = post.profile === 'premium';
  const premiumIncluded = ['freq_converter'];
  const postExtras: PostRow[] = state.step8.extras
    .filter((e) => e.selected)
    .map((e) => {
      const effectivePrice = (isPremium && premiumIncluded.includes(e.id)) ? 0 : e.price;
      const label = e.name + (e.quantity > 1 ? ` x${e.quantity}` : '')
        + (effectivePrice === 0 && e.price > 0 ? ' (входит в Премиум)' : '');
      return { name: label, price: effectivePrice * e.quantity };
    });

  // Second pump
  let secondPump: PostRow | null = null;
  if (state.step8.secondPumpEnabled) {
    const defaultSel = state.step5.avdSelections.find((s) => s.isDefault);
    const defaultAvd = defaultSel ? avdKits.find((k) => k.id === defaultSel.avdId) : null;
    const spPrice = defaultAvd ? (defaultAvd.price > 0 ? defaultAvd.price : 85000) : 0;
    const spName = defaultAvd?.name?.replace(' (входит в комплект)', '') ?? '—';
    secondPump = { name: `Вторая помпа — ${spName}`, price: spPrice };
  }

  const basePriceWithBum = basePrice + bumPrice;
  const accTotal = accessories.reduce((s, r) => s + r.price, 0);
  const payTotal = payments.reduce((s, r) => s + r.price, 0);
  const funTotal = functions.reduce((s, r) => s + r.price, 0);
  const pmpTotal = pumps.reduce((s, r) => s + r.price, 0);
  const extTotal = postExtras.reduce((s, r) => s + r.price, 0);
  const spTotal = secondPump?.price ?? 0;
  const postTotal = basePriceWithBum + accTotal + payTotal + funTotal + pmpTotal + extTotal + spTotal;

  return {
    title: getPostName(post, idx),
    profileName: profile?.name ?? '—',
    basePrice: basePriceWithBum,
    includedItems: profile?.includedComponents ?? [],
    bumName,
    bumPrice: 0,
    defaultBumName,
    bumSwapped,
    payments,
    accessories,
    baseFunctions,
    functions,
    pumps,
    postExtras,
    secondPump,
    postTotal,
  };
}

// ─── Wash block (MSO + Robot) ───

function calcWashBlock(state: WizardState): WashBlock {
  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;
  const customWater = state.step7.customWaterPrice || 0;

  // Build individual water rows
  const waterRows: PostRow[] = [];
  let waterTotal = 0;

  if (state.step7.osmosOption === 'none') {
    waterRows.push({ name: 'Осмос: клиент докупит самостоятельно', price: 0 });
  } else if (osmos) {
    waterRows.push({ name: `Осмос: ${osmos.name}`, price: osmos.price });
    waterTotal += osmos.price;
  }

  if (aras && aras.id !== 'none') {
    waterRows.push({ name: `АРОС: ${aras.name}`, price: arasPrice });
    waterTotal += arasPrice;
  } else if (state.step7.arasModel === 'none') {
    waterRows.push({ name: 'АРОС: не нужно', price: 0 });
  }

  if (customWater > 0) {
    waterRows.push({ name: 'Водоподготовка (ручной ввод)', price: customWater });
    waterTotal += customWater;
  }

  if (state.step7.boosterPump) {
    waterRows.push({ name: 'Станция повышающая давление', price: boosterPumpPrice });
    waterTotal += boosterPumpPrice;
  }

  if (state.step7.softeningAll && state.step7.softeningAllPrice > 0) {
    waterRows.push({ name: 'Умягчение на все функции', price: state.step7.softeningAllPrice });
    waterTotal += state.step7.softeningAllPrice;
  }

  if (state.step7.softeningOsmos && state.step7.softeningOsmosPrice > 0) {
    waterRows.push({ name: 'Умягчение для осмоса', price: state.step7.softeningOsmosPrice });
    waterTotal += state.step7.softeningOsmosPrice;
  }

  // Vacuum
  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacPrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;
  const vacLabel = vac && vac.id !== 'none'
    ? `${vac.name} x${state.step9.vacuumQuantity}`
    : 'Нет';

  // Wash extras (Step 9)
  const washExtras: PostRow[] = state.step9.extras
    .filter((e) => e.selected)
    .map((e) => ({ name: e.name + (e.quantity > 1 ? ` x${e.quantity}` : ''), price: e.price * e.quantity }));

  // Pipelines
  const pipAir = state.step9.pipelinesAirPrice || 0;
  const pipWater = state.step9.pipelinesWaterPrice || 0;
  const pipChem = state.step9.pipelinesChemPrice || 0;

  const washTotal = waterTotal + vacPrice
    + washExtras.reduce((s, r) => s + r.price, 0)
    + pipAir + pipWater + pipChem;

  return {
    waterRows,
    waterTotal,
    vacuumLabel: vacLabel,
    vacuumPrice: vacPrice,
    extras: washExtras,
    pipelines: { air: pipAir, water: pipWater, chem: pipChem },
    washTotal,
  };
}

// ─── Shared totals ───

function calcSharedTotals(state: WizardState, subtotal: number): TotalsBlock {
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

  return {
    subtotal,
    discountPct,
    discountAmount,
    discountWarning: discountPct > 3,
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
}

function calcRobotTotals(state: WizardState, subtotal: number, robotMontagePrice: number): TotalsBlock {
  const discountPct = state.step10.discount;
  const discountAmount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmount;

  const montageAmount = state.step10.robotMontage ? robotMontagePrice : 0;
  const montageTypeLabel = state.step10.robotMontage ? `Монтаж (фикс. ${robotMontagePrice.toLocaleString('ru-RU')} \u20BD)` : 'Нет';

  const vatEnabled = state.step10.vatEnabled;
  const vatPct = state.step10.vat;
  const vatBase = afterDiscount + montageAmount;
  const vatAmount = vatEnabled ? vatBase * (vatPct / 100) : 0;
  const total = vatBase + vatAmount;

  return {
    subtotal,
    discountPct,
    discountAmount,
    discountWarning: discountPct > 3,
    afterDiscount,
    montageType: montageTypeLabel,
    montageFromSubtotal: montageAmount,
    montageExtra: 0,
    montageAmount,
    vatEnabled,
    vatPct,
    vatBase,
    vatAmount,
    total,
  };
}

// ─── Robot branch ───

function gatherRobotDocData(state: WizardState, header: HeaderData): DocData {
  const robot = robotModels.find((m) => m.id === state.robotStep2.robotModel);
  const robotPrice = robot?.price ?? 0;

  const bur = burModels.find((b) => b.id === state.robotStep3.burModel);
  const burPrice = bur?.price ?? 0;

  const guidesIncluded = ['premium_360', 'cosmo_360'].includes(state.robotStep2.robotModel);
  const options: PostRow[] = [];
  if (state.robotStep4.sideBlowerEnabled && (state.robotStep4.sideBlowerPrice || 0) > 0) {
    options.push({ name: 'Боковой обдув', price: state.robotStep4.sideBlowerPrice || 0 });
  }
  if (state.robotStep4.guidesEnabled && !guidesIncluded && (state.robotStep4.guidesPrice || 0) > 0) {
    options.push({ name: 'Направляющие', price: state.robotStep4.guidesPrice || 0 });
  }
  const optionsTotal = options.reduce((s, r) => s + r.price, 0);

  const extras: PostRow[] = (state.robotStep4.extras ?? [])
    .filter((e) => e.selected)
    .map((e) => {
      const item = robotExtraEquipment.find((r) => r.id === e.id);
      return { name: item?.name ?? e.id, price: item?.price ?? 0 };
    });
  const extrasTotal = extras.reduce((s, r) => s + r.price, 0);

  const robotTotal = robotPrice + burPrice + optionsTotal + extrasTotal;

  const robotBlock: RobotBlock = {
    modelName: robot?.name ?? '—',
    modelPrice: robotPrice,
    includedComponents: robot?.includedComponents ?? [],
    burName: bur?.name ?? '—',
    burPrice,
    options,
    optionsTotal,
    extras,
    extrasTotal,
    robotTotal,
  };

  const wash = calcWashBlock(state);

  const subtotal = robotTotal + wash.washTotal;
  // Robot: fixed montage 370k instead of percentage-based
  const robotMontagePrice = 370_000;
  const totals = calcRobotTotals(state, subtotal, robotMontagePrice);

  return {
    isRobot: true,
    isTruck: false,
    header,
    posts: [],
    robot: robotBlock,
    truck: null,
    wash,
    totals,
    deliveryConditions: state.step10.deliveryConditions || '—',
    paymentConditions: state.step10.paymentConditions || '—',
    language: state.step10.language,
  };
}

// ─── Truck branch ───

function gatherTruckDocData(state: WizardState, header: HeaderData): DocData {
  const truckType = truckWashTypes.find((t) => t.id === state.truckStep2.selectedType);
  const basePrice = truckType?.price ?? 0;
  const isKompak = state.truckStep2.selectedType === 'kompak';

  // BUR
  const bur = burModels.find((b) => b.id === state.truckBur.burModel);
  const burName = bur?.name ?? '—';
  const burPrice = bur?.price ?? 0;

  // Options (checkboxes available for both КОМПАК and SmartBot Track)
  const options: PostRow[] = [];
  let optionsTotal = 0;
  state.truckStep3.selectedOptions.forEach((optId) => {
    const opt = kompakOptions.find((o) => o.id === optId);
    if (opt) {
      options.push({ name: opt.name, price: opt.price });
      optionsTotal += opt.price;
    }
  });
  if (!isKompak && state.truckStep3.customOptionsPrice > 0) {
    options.push({ name: 'Дополнительные опции', price: state.truckStep3.customOptionsPrice });
    optionsTotal += state.truckStep3.customOptionsPrice;
  }

  // Manual post
  const manualPost: PostRow[] = [];
  let manualPostTotal = 0;
  let manualPostMontage = 0;
  if (state.truckStep4.manualPostEnabled) {
    const avdItem = truckManualPostEquipment.find((e) => e.id === 'avd');
    const hangerItem = truckManualPostEquipment.find((e) => e.id === 'cable_hanger');
    if (avdItem && state.truckStep4.avdCount > 0) {
      const p = avdItem.price * state.truckStep4.avdCount;
      manualPost.push({ name: `${avdItem.name} x${state.truckStep4.avdCount}`, price: p });
      manualPostTotal += p;
    }
    if (hangerItem && state.truckStep4.hangerCount > 0) {
      const p = hangerItem.price * state.truckStep4.hangerCount;
      manualPost.push({ name: `${hangerItem.name} x${state.truckStep4.hangerCount}`, price: p });
      manualPostTotal += p;
    }
    manualPostMontage = truckManualPostMontage;
    manualPostTotal += manualPostMontage;
  }

  // Water
  const waterSys = truckWaterSystems.find((w) => w.id === state.truckStep5.selectedWater);
  let waterLabel = waterSys?.name ?? '—';
  let waterPrice = waterSys?.price ?? 0;
  if (state.truckStep5.selectedWater === 'custom') {
    waterPrice = state.truckStep5.customWaterPrice || 0;
    waterLabel = 'Своя стоимость';
  }

  const truckTotal = basePrice + burPrice + optionsTotal + manualPostTotal + waterPrice;

  const truckBlock: TruckBlock = {
    typeName: truckType?.name ?? '—',
    typePrice: basePrice,
    includedItems: truckType?.features ?? [],
    burName,
    burPrice,
    options,
    optionsTotal,
    manualPost,
    manualPostMontage,
    manualPostTotal,
    waterLabel,
    waterPrice,
    truckTotal,
  };

  // Totals — КОМПАК has fixed montage
  const subtotal = truckTotal;
  let totals: TotalsBlock;
  if (isKompak) {
    const discountPct = state.step10.discount;
    const discountAmount = subtotal * (discountPct / 100);
    const afterDiscount = subtotal - discountAmount;
    const montage = state.step10.montage;
    const montageAmount = montage !== 'none' ? kompakMontagePrice + (montage === 'full' ? (state.step10.montageExtra || 0) : 0) : 0;
    const vatEnabled = state.step10.vatEnabled;
    const vatPct = state.step10.vat;
    const vatBase = afterDiscount + montageAmount;
    const vatAmount = vatEnabled ? vatBase * (vatPct / 100) : 0;
    const total = vatBase + vatAmount;
    totals = {
      subtotal,
      discountPct,
      discountAmount,
      discountWarning: discountPct > 3,
      afterDiscount,
      montageType: montage !== 'none' ? `Монтаж (фикс. ${kompakMontagePrice.toLocaleString('ru-RU')} \u20BD)` : 'Нет',
      montageFromSubtotal: montage !== 'none' ? kompakMontagePrice : 0,
      montageExtra: montage === 'full' ? (state.step10.montageExtra || 0) : 0,
      montageAmount,
      vatEnabled,
      vatPct,
      vatBase,
      vatAmount,
      total,
    };
  } else {
    totals = calcSharedTotals(state, subtotal);
  }

  // Empty wash block for truck
  const wash: WashBlock = {
    waterRows: [],
    waterTotal: 0,
    vacuumLabel: 'Нет',
    vacuumPrice: 0,
    extras: [],
    pipelines: { air: 0, water: 0, chem: 0 },
    washTotal: 0,
  };

  return {
    isRobot: false,
    isTruck: true,
    header,
    posts: [],
    robot: null,
    truck: truckBlock,
    wash,
    totals,
    deliveryConditions: state.step10.deliveryConditions || '—',
    paymentConditions: state.step10.paymentConditions || '—',
    language: state.step10.language,
  };
}

// ─── Main entry ───

export function gatherDocData(state: WizardState): DocData {
  const mgr = managers.find((m) => m.id === state.step1.manager);

  const header: HeaderData = {
    date: new Date().toLocaleDateString('ru-RU'),
    manager: mgr?.name ?? (state.step1.manager || '—'),
    client: state.step1.clientSearch || '—',
    vehicleType: state.step1.vehicleType === 'passenger' ? 'Легковой (коммерческий)' : 'Грузовой',
    objectType: state.step1.objectType === 'truck' ? 'Грузовая мойка' : state.step1.objectType === 'self_service' ? 'Мойка самообслуживания' : 'Роботизированная мойка',
    region: state.step10.region || '—',
  };

  const isRobot = state.step1.objectType === 'robotic';
  const isTruck = state.step1.objectType === 'truck';
  if (isRobot) return gatherRobotDocData(state, header);
  if (isTruck) return gatherTruckDocData(state, header);

  // ─── MSO branch ───
  const postsData = state.posts.length > 0 ? state.posts : [];
  const postBlocks = postsData.map((p, i) => calcPostBlock(p, i, state));

  const wash = calcWashBlock(state);

  // Mirror CostPanel subtotal logic exactly (delta-based pricing)
  const postCount = Math.max(postBlocks.length, 1);

  const profileObj = profiles.find((p) => p.id === state.step2.profile);
  // Use profile.price (bundle) as base — includes default accessories, AVD, and payments
  const cpProfilePrice = profileObj?.price ?? 0;
  const cpDefaultAccIds = profileObj?.defaultAccessories ?? [];

  // Only count accessories NOT included in profile bundle
  const cpExtraAccPrice = state.step2.accessories
    .filter((a) => a.selected && !cpDefaultAccIds.includes(a.id))
    .reduce((s, a) => s + (a.customPrice !== undefined ? a.customPrice : a.price), 0);

  const cpBumUpgrade = calcBumPrice(state.step3.bumModel, state.step2.profile);

  // Payment delta: current minus default
  const cpDefaultPayments = profileObj?.defaultPayments ?? [];
  const cpCurrentPayCost = calcPaymentCost(state.step3.paymentSystems);
  const cpDefaultPayCost = calcPaymentCost(cpDefaultPayments);
  const cpPaymentDelta = cpCurrentPayCost - cpDefaultPayCost;

  const cpFuncPrice = state.step4.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .reduce((s, f) => {
      let p = 0;
      if (f.option === 'button_only') p = f.buttonPrice;
      else if (f.option === 'button_and_kit') p = f.buttonPrice + f.kitPrice;
      if (f.requiresDosator && f.selectedDosator) p += dosatorOptions.find((d) => d.id === f.selectedDosator)?.price ?? 0;
      return s + p;
    }, 0);

  // AVD delta: current minus default AVD
  const cpDefaultAvdKit = avdKits.find((a) => a.id === profileObj?.defaultAvd);
  const cpDefaultAvdPrice = cpDefaultAvdKit?.price ?? 0;
  const cpCurrentAvdPrice = state.step5.avdSelections.reduce((s, sel) => {
    return s + (avdKits.find((a) => a.id === sel.avdId)?.price ?? 0);
  }, 0) + (state.step5.customPumpPrice || 0);
  const cpAvdDelta = cpCurrentAvdPrice - cpDefaultAvdPrice;

  let cpSecondPumpPrice = 0;
  if (state.step8.secondPumpEnabled) {
    const ds = state.step5.avdSelections.find((s2) => s2.isDefault);
    const da = ds ? avdKits.find((k) => k.id === ds.avdId) : null;
    cpSecondPumpPrice = da ? (da.price > 0 ? da.price : 85000) : 0;
  }
  const gIsPremium = state.step2.profile === 'premium';
  const gPremiumIncluded = ['freq_converter'];
  const cpPostExtras = state.step8.extras.filter((e) => e.selected).reduce((s, e) => {
    const p = (gIsPremium && gPremiumIncluded.includes(e.id)) ? 0 : e.price;
    return s + p * e.quantity;
  }, 0) + cpSecondPumpPrice;

  const cpBasePriceWithBum = cpProfilePrice + cpExtraAccPrice + cpBumUpgrade;
  const cpUpgradesPerPost = cpPaymentDelta + cpFuncPrice + cpAvdDelta;
  const cpEquipmentTotal = (cpBasePriceWithBum + cpUpgradesPerPost) * postCount;
  const cpWashTotal = wash.waterTotal + cpPostExtras + wash.vacuumPrice
    + wash.extras.reduce((s, r) => s + r.price, 0)
    + (wash.pipelines.air + wash.pipelines.water + wash.pipelines.chem);
  const subtotal = cpEquipmentTotal + cpWashTotal;

  const totals = calcSharedTotals(state, subtotal);

  return {
    isRobot: false,
    isTruck: false,
    header,
    posts: postBlocks,
    robot: null,
    truck: null,
    wash,
    totals,
    deliveryConditions: state.step10.deliveryConditions || '—',
    paymentConditions: state.step10.paymentConditions || '—',
    language: state.step10.language,
  };
}

export function makeFileName(state: WizardState, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const client = state.step1.clientSearch?.trim();
  const base = client ? `KP_DKR_${date}_${client}` : `KP_DKR_${date}`;
  return base.replace(/[^\w\d_а-яА-ЯёЁ-]/g, '_') + `.${ext}`;
}

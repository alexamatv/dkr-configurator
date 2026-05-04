'use client';

import { useState } from 'react';
import type { WizardState, Step10Data, MontageType } from '@/types';
import {
  dosatorOptions,
  calcPaymentCost,
} from '@/data/mockData';
import { useData, type DataContextValue } from '@/context/DataContext';

interface CostPanelProps {
  state: WizardState;
  onUpdateStep10: (data: Step10Data) => void;
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

interface CalcResult {
  postCount: number;
  unitLabel: string;
  lines: [string, number][];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatPct: number;
  vatAmount: number;
  montage: MontageType;
  montagePct: number;
  montageExtra: number;
  montageAmount: number;
  total: number;
}

function calcMso(state: WizardState, data: DataContextValue): CalcResult {
  const { profiles, avdKits, osmosOptions, arasModels, vacuumOptions, postVacuums, calcBumPrice, getSetting } = data;
  const boosterPumpPrice = getSetting('booster_pump_price', 53000);
  const postVacuumPrice = postVacuums.find((v) => v.id === state.step8.selectedPostVacuumId)?.price ?? 0;
  const posts = state.posts.length > 0 ? state.posts : [];
  const postCount = Math.max(posts.length, 1);

  const profile = profiles.find((p) => p.id === state.step2.profile);
  // Use profile.price (bundle price) as base — it includes default accessories, AVD, and payments
  const profilePrice = profile?.price ?? 0;
  const defaultAccIds = profile?.defaultAccessories ?? [];

  // Only count accessories that are selected but NOT included in the profile bundle
  const extraAccessoriesPrice = state.step2.accessories
    .filter((a) => a.selected && !defaultAccIds.includes(a.id))
    .reduce((sum, a) => sum + (a.customPrice !== undefined ? a.customPrice : a.price), 0);

  const bumUpgrade = calcBumPrice(state.step3.bumModel, state.step2.profile);

  // Payment delta: current cost minus default cost
  const defaultPayments = profile?.defaultPayments ?? [];
  const currentPayCost = calcPaymentCost(state.step3.paymentSystems);
  const defaultPayCost = calcPaymentCost(defaultPayments);
  const paymentDelta = currentPayCost - defaultPayCost;

  const functionsPrice = state.step4.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .reduce((sum, f) => {
      let price = 0;
      if (f.option === 'button_only') price = f.buttonPrice;
      else if (f.option === 'button_and_kit') price = f.buttonPrice + f.kitPrice;
      if (f.requiresDosator && f.selectedDosator) {
        price += dosatorOptions.find((d) => d.id === f.selectedDosator)?.price ?? 0;
      }
      return sum + price;
    }, 0);

  // AVD delta: current cost minus default AVD cost
  const defaultAvdKit = avdKits.find((a) => a.id === profile?.defaultAvd);
  const defaultAvdPrice = defaultAvdKit?.price ?? 0;
  const currentAvdPrice = state.step5.avdSelections.reduce((sum, sel) => {
    const kit = avdKits.find((a) => a.id === sel.avdId);
    return sum + (kit?.price ?? 0);
  }, 0) + (state.step5.customPumpPrice || 0);
  const avdDelta = currentAvdPrice - defaultAvdPrice;

  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const osmosPrice = osmos?.price ?? 0;

  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;

  let secondPumpPrice = 0;
  if (state.step8.secondPumpEnabled) {
    const defaultSel = state.step5.avdSelections.find((s) => s.isDefault);
    const defaultAvd = defaultSel ? avdKits.find((k) => k.id === defaultSel.avdId) : null;
    secondPumpPrice = defaultAvd ? (defaultAvd.price > 0 ? defaultAvd.price : 85000) : 0;
  }

  const isPremium = state.step2.profile === 'premium';
  const premiumIncludedExtras = ['freq_converter'];
  const postExtrasPrice = state.step8.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => {
      const price = (isPremium && premiumIncludedExtras.includes(e.id)) ? 0 : e.price;
      return sum + price * e.quantity;
    }, 0) + secondPumpPrice;

  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacuumBasePrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;
  const vacuumSubPrice = state.step9.vacuumOption !== 'none'
    ? (state.step9.vacuumSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * state.step9.vacuumQuantity
    : 0;
  const vacuumPrice = vacuumBasePrice + vacuumSubPrice;

  const washExtrasBasePrice = state.step9.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const dispenserItem = state.step9.extras.find((e) => e.id === 'washer_fluid_dispenser');
  const dispenserSubPrice = dispenserItem?.selected
    ? (state.step9.dispenserSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * (dispenserItem.quantity || 1)
    : 0;

  const foggerItem = state.step9.extras.find((e) => e.id === 'dry_fog_machine');
  const foggerSubPrice = foggerItem?.selected
    ? (state.step9.foggerSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * (foggerItem.quantity || 1)
    : 0;

  const washExtrasPrice = washExtrasBasePrice + dispenserSubPrice + foggerSubPrice;

  const pipelinesPrice =
    (state.step9.pipelinesAirPrice || 0) +
    (state.step9.pipelinesWaterPrice || 0) +
    (state.step9.pipelinesChemPrice || 0);

  const basePriceWithBum = profilePrice + extraAccessoriesPrice + bumUpgrade;
  // Post-mounted vacuum price applies to every post (multiplied by postCount
  // alongside the other per-post upgrades).
  const upgradesPerPost = paymentDelta + functionsPrice + avdDelta + postVacuumPrice;
  const equipmentTotal = (basePriceWithBum + upgradesPerPost) * postCount;
  const customWaterPrice = state.step7.customWaterPrice || 0;
  const boosterCost = state.step7.boosterPump
    ? boosterPumpPrice * Math.max(1, state.step7.boosterPumpQuantity || 1)
    : 0;
  const softeningCost = (state.step7.softeningAll ? (state.step7.softeningAllPrice || 0) : 0)
    + (state.step7.softeningOsmos ? (state.step7.softeningOsmosPrice || 0) : 0);
  const waterTotal = osmosPrice + arasPrice + customWaterPrice + boosterCost + softeningCost;
  const washTotal = waterTotal + postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice;
  const subtotal = equipmentTotal + washTotal;

  return calcTotals(state, data, subtotal, postCount, 'пост(ов)', [
    ['Базовая комплектация', basePriceWithBum * postCount],
    ['Оборудование (доплата)', avdDelta * postCount],
    ['Функции и опции', (functionsPrice + paymentDelta) * postCount],
    ['Водоподготовка', waterTotal],
    ['Доп. оборудование', postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice],
  ]);
}

function calcRobot(state: WizardState, data: DataContextValue): CalcResult {
  const { robotModels, burModels, osmosOptions, arasModels, vacuumOptions, robotExtras, getSetting } = data;
  const robotMontagePrice = getSetting('montage_robot_fixed', 370000);
  const boosterPumpPrice = getSetting('booster_pump_price', 53000);
  const robot = robotModels.find((m) => m.id === state.robotStep2.robotModel);
  const robotPrice = robot?.price ?? 0;

  const bur = burModels.find((b) => b.id === state.robotStep3.burModel);
  const burPrice = bur?.price ?? 0;

  // Robot options
  const guidesIncluded = ['premium_360', 'cosmo_360'].includes(state.robotStep2.robotModel);
  const sideBlowerCost = state.robotStep4.sideBlowerEnabled ? (state.robotStep4.sideBlowerPrice || 0) : 0;
  const guidesCost = (!guidesIncluded && state.robotStep4.guidesEnabled) ? (state.robotStep4.guidesPrice || 0) : 0;
  const robotExtrasTotal = (state.robotStep4.extras ?? [])
    .filter((e) => e.selected)
    .reduce((sum, e) => {
      const item = robotExtras.find((r) => r.id === e.id);
      return sum + (item?.price ?? 0);
    }, 0);
  // Pill selections (Купюроприёмник / QR / Индивидуальный дизайн / …) live in
  // robotStep4.subOptions. Same "≤ 1 ₽ is just a placeholder" rule as МСО.
  const robotSubOptionsTotal = (state.robotStep4.subOptions ?? [])
    .filter((o) => o.selected)
    .reduce((s, o) => s + o.price, 0);
  const optionsTotal = sideBlowerCost + guidesCost + robotExtrasTotal + robotSubOptionsTotal;

  // Water (reuses step7)
  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const osmosPrice = osmos?.price ?? 0;
  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;
  const customWaterPrice = state.step7.customWaterPrice || 0;
  const boosterCost = state.step7.boosterPump
    ? boosterPumpPrice * Math.max(1, state.step7.boosterPumpQuantity || 1)
    : 0;
  const softeningCost = (state.step7.softeningAll ? (state.step7.softeningAllPrice || 0) : 0)
    + (state.step7.softeningOsmos ? (state.step7.softeningOsmosPrice || 0) : 0);
  const waterTotal = osmosPrice + arasPrice + customWaterPrice + boosterCost + softeningCost;

  // Wash extras (reuses step9)
  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacuumBasePrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;
  const vacuumSubPrice = state.step9.vacuumOption !== 'none'
    ? (state.step9.vacuumSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * state.step9.vacuumQuantity
    : 0;
  const vacuumPrice = vacuumBasePrice + vacuumSubPrice;
  const washExtrasBasePrice = state.step9.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const dispenserItem = state.step9.extras.find((e) => e.id === 'washer_fluid_dispenser');
  const dispenserSubPrice = dispenserItem?.selected
    ? (state.step9.dispenserSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * (dispenserItem.quantity || 1)
    : 0;

  const foggerItem = state.step9.extras.find((e) => e.id === 'dry_fog_machine');
  const foggerSubPrice = foggerItem?.selected
    ? (state.step9.foggerSubOptions ?? [])
        .filter((o) => o.selected)
        .reduce((s, o) => s + o.price, 0) * (foggerItem.quantity || 1)
    : 0;

  const washExtrasPrice = washExtrasBasePrice + dispenserSubPrice + foggerSubPrice;
  const pipelinesPrice =
    (state.step9.pipelinesAirPrice || 0) +
    (state.step9.pipelinesWaterPrice || 0) +
    (state.step9.pipelinesChemPrice || 0);
  const equipTotal = vacuumPrice + washExtrasPrice + pipelinesPrice;

  const subtotal = robotPrice + burPrice + optionsTotal + waterTotal + equipTotal;

  const result = calcTotals(state, data, subtotal, 1, 'робот', [
    ['Модель робота', robotPrice],
    ['БУР', burPrice],
    ['Опции робота', optionsTotal],
    ['Водоподготовка', waterTotal],
    ['Доп. оборудование', equipTotal],
  ]);

  // Robot: fixed montage price instead of percentage-based
  const robotMontageAmount = state.step10.robotMontage ? robotMontagePrice : 0;
  const beforeVat = result.subtotal - result.discountAmount + robotMontageAmount;
  const vatAmount = result.vatEnabled ? beforeVat * (result.vatPct / 100) : 0;

  return {
    ...result,
    montage: state.step10.robotMontage ? 'full' : 'none',
    montagePct: robotMontageAmount,
    montageExtra: 0,
    montageAmount: robotMontageAmount,
    total: beforeVat + vatAmount,
    vatAmount,
  };
}

function calcTruck(state: WizardState, data: DataContextValue): CalcResult {
  const { truckWashTypes, burModels, kompakOptions, truckManualPost, truckWaterSystems, getSetting } = data;
  const kompakMontagePrice = getSetting('montage_kompak_fixed', 1080000);
  const truckManualPostMontage = getSetting('truck_manual_post_montage', 200000);
  const truckType = truckWashTypes.find((t) => t.id === state.truckStep2.selectedType);
  const basePrice = truckType?.price ?? 0;
  const isKompak = state.truckStep2.selectedType === 'kompak';

  // BUR
  const bur = burModels.find((b) => b.id === state.truckBur.burModel);
  const burPrice = bur?.price ?? 0;

  // Options (checkboxes for both types + custom price for SmartBot Track)
  let optionsPrice = state.truckStep3.selectedOptions.reduce((sum, optId) => {
    const opt = kompakOptions.find((o) => o.id === optId);
    return sum + (opt?.price ?? 0);
  }, 0);
  if (!isKompak) {
    optionsPrice += state.truckStep3.customOptionsPrice || 0;
  }

  // Manual post
  let manualPostPrice = 0;
  if (state.truckStep4.manualPostEnabled) {
    const avdItem = truckManualPost.find((e) => e.id === 'avd');
    const hangerItem = truckManualPost.find((e) => e.id === 'cable_hanger');
    manualPostPrice = (avdItem?.price ?? 0) * state.truckStep4.avdCount
      + (hangerItem?.price ?? 0) * state.truckStep4.hangerCount
      + truckManualPostMontage;
  }

  // Water
  const waterSys = truckWaterSystems.find((w) => w.id === state.truckStep5.selectedWater);
  const waterPrice = (waterSys?.price ?? 0) + (state.truckStep5.selectedWater === 'custom' ? (state.truckStep5.customWaterPrice || 0) : 0);

  const subtotal = basePrice + burPrice + optionsPrice + manualPostPrice + waterPrice;

  // For КОМПАК: fixed montage instead of percentage
  const lines: [string, number][] = [
    ['Мойка', basePrice],
    ['БУР', burPrice],
    ['Опции', optionsPrice],
    ['Ручной пост', manualPostPrice],
    ['Водоочистка', waterPrice],
  ];

  if (isKompak) {
    // Override calcTotals montage with fixed kompak montage
    const discountPct = state.step10.discount;
    const discountAmount = subtotal * (discountPct / 100);
    const afterDiscount = subtotal - discountAmount;

    const montage = state.step10.montage;
    const montageAmount = montage !== 'none' ? kompakMontagePrice + (montage === 'full' ? (state.step10.montageExtra || 0) : 0) : 0;

    const vatEnabled = state.step10.vatEnabled;
    const vatPct = state.step10.vat;
    const beforeVat = afterDiscount + montageAmount;
    const vatAmount = vatEnabled ? beforeVat * (vatPct / 100) : 0;
    const total = beforeVat + vatAmount;

    return {
      postCount: 1,
      unitLabel: 'грузовая мойка',
      lines,
      subtotal,
      discountPct,
      discountAmount,
      vatEnabled,
      vatPct,
      vatAmount,
      montage,
      montagePct: montage !== 'none' ? kompakMontagePrice : 0,
      montageExtra: montage === 'full' ? (state.step10.montageExtra || 0) : 0,
      montageAmount,
      total,
    };
  }

  return calcTotals(state, data, subtotal, 1, 'грузовая мойка', lines);
}

function calcTotals(
  state: WizardState,
  data: DataContextValue,
  subtotal: number,
  postCount: number,
  unitLabel: string,
  lines: [string, number][],
): CalcResult {
  const discountPct = state.step10.discount;
  const discountAmount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmount;

  const vatEnabled = state.step10.vatEnabled;
  const vatPct = state.step10.vat;

  const montage = state.step10.montage;
  const fullPct = data.getSetting('montage_full_pct', 0.10);
  const commPct = data.getSetting('montage_commissioning_pct', 0.05);
  const montageRate = montage === 'commissioning' ? commPct : montage === 'full' ? fullPct : 0;
  const montagePct = subtotal * montageRate;
  const montageExtra = montage === 'full' ? (state.step10.montageExtra || 0) : 0;
  const montageAmount = montagePct + montageExtra;

  const beforeVat = afterDiscount + montageAmount;
  const vatAmount = vatEnabled ? beforeVat * (vatPct / 100) : 0;

  const total = beforeVat + vatAmount;

  return {
    postCount,
    unitLabel,
    lines,
    subtotal,
    discountPct,
    discountAmount,
    vatEnabled,
    vatPct,
    vatAmount,
    montage,
    montagePct,
    montageExtra,
    montageAmount,
    total,
  };
}

const montageOptions: { value: MontageType; label: string }[] = [
  { value: 'none', label: 'Нет' },
  { value: 'full', label: 'Монтаж 10%' },
  { value: 'commissioning', label: 'Шеф 5%' },
];

function CostContent({
  state,
  onUpdateStep10,
  calc,
  isRobot,
  robotMontagePrice,
}: {
  state: WizardState;
  onUpdateStep10: (data: Step10Data) => void;
  calc: CalcResult;
  isRobot?: boolean;
  robotMontagePrice: number;
}) {
  const {
    postCount, unitLabel, lines, discountPct, discountAmount,
    vatEnabled, vatPct, vatAmount, montage, montagePct, montageExtra, montageAmount, total,
  } = calc;

  const update10 = (patch: Partial<Step10Data>) =>
    onUpdateStep10({ ...state.step10, ...patch });

  return (
    <div className="p-4 space-y-3 text-sm">
      {lines.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-medium tabular-nums">{fmt(value)}</span>
        </div>
      ))}

      <div className="border-t border-border pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Скидка</span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => update10({ discount: parseFloat(e.target.value) || 0 })}
              className="w-14 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:border-accent"
            />
            <span className="text-muted text-xs">%</span>
          </div>
          <span className={`font-medium tabular-nums ${discountAmount > 0 ? 'text-success' : ''}`}>
            −{fmt(discountAmount)}
          </span>
        </div>
        {discountPct > 3 && (
          <p className="text-[10px] text-red-500 leading-tight">
            Скидка требует согласования у руководства. Максимальный размер скидки без согласования 3%
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={vatEnabled}
                onChange={(e) => update10({ vatEnabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-accent"
              />
              <span className="text-muted">НДС</span>
              {vatEnabled && (
                <>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={vatPct}
                    onChange={(e) => update10({ vat: parseFloat(e.target.value) || 0 })}
                    className="w-12 bg-background border border-border rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:border-accent"
                  />
                  <span className="text-muted text-xs">%</span>
                </>
              )}
            </label>
            <span className="font-medium tabular-nums">
              {vatEnabled ? fmt(vatAmount) : 'не применяется'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Монтаж</span>
            <span className="font-medium tabular-nums">{fmt(montageAmount)}</span>
          </div>
          {isRobot ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.step10.robotMontage}
                onChange={(e) => update10({ robotMontage: e.target.checked })}
                className="w-3.5 h-3.5 accent-accent"
              />
              <span className="text-[11px] text-muted">Монтаж — {fmt(robotMontagePrice)}</span>
            </label>
          ) : (
            <>
              <div className="flex gap-1">
                {montageOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update10({ montage: opt.value, montageExtra: opt.value !== 'full' ? 0 : state.step10.montageExtra })}
                    className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                      montage === opt.value
                        ? 'bg-accent text-white'
                        : 'bg-background border border-border text-muted hover:border-accent/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {montage === 'full' && montageExtra > 0 && (
                <div className="text-[10px] text-muted">
                  10%: {fmt(montagePct)} + доп. работы: {fmt(montageExtra)} = {fmt(montageAmount)}
                </div>
              )}
              {montage === 'full' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-muted whitespace-nowrap">Доп. работы</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={state.step10.montageExtra || ''}
                    onChange={(e) => update10({ montageExtra: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-24 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-muted">₽</span>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <div className="border-t-2 border-accent/30 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-bold">ИТОГО</span>
          <span className="text-2xl font-bold text-accent tabular-nums">{fmt(total)}</span>
        </div>
        {postCount > 1 && (
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>Цена на 1 {unitLabel}</span>
            <span className="tabular-nums">{fmt(total / postCount)}</span>
          </div>
        )}
      </div>

      <button className="w-full mt-4 py-2 px-4 bg-accent/20 text-accent text-sm font-medium rounded hover:bg-accent/30 transition-colors">
        Детальный расчёт
      </button>
    </div>
  );
}

export function CostPanel({ state, onUpdateStep10 }: CostPanelProps) {
  const data = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRobot = state.step1.objectType === 'robotic';
  const isTruck = state.step1.objectType === 'truck';
  const rawCalc = isTruck ? calcTruck(state, data) : isRobot ? calcRobot(state, data) : calcMso(state, data);
  // Show zeros on step 1 before any configuration
  const calc = state.currentStep === 1 ? {
    ...rawCalc,
    lines: rawCalc.lines.map(([label]) => [label, 0] as [string, number]),
    subtotal: 0, discountAmount: 0, vatAmount: 0, montageAmount: 0, montagePct: 0, montageExtra: 0, total: 0,
  } : rawCalc;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[300px] shrink-0 bg-surface border-l border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Расчёт стоимости</h3>
          <p className="text-xs text-muted mt-1">
            {isTruck ? '1 грузовая мойка' : isRobot ? '1 робот' : `${calc.postCount} пост(ов)`}
          </p>
        </div>
        <CostContent state={state} onUpdateStep10={onUpdateStep10} calc={calc} isRobot={isRobot} robotMontagePrice={data.getSetting('montage_robot_fixed', 370000)} />
      </div>

      {/* Mobile floating button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-[68px] left-0 right-0 z-30 mx-4 py-3 bg-accent text-white font-bold text-sm rounded-lg shadow-lg shadow-accent/30 flex items-center justify-center gap-2"
      >
        <span>ИТОГО:</span>
        <span>{fmt(calc.total)}</span>
      </button>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="flex-shrink-0 bg-overlay"
            style={{ height: '60px' }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="flex-1 bg-surface rounded-t-2xl overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-surface z-10 flex items-center justify-between p-4 border-b border-border rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-foreground">Расчёт стоимости</h3>
                <p className="text-xs text-muted mt-0.5">
                  {isTruck ? '1 грузовая мойка' : isRobot ? '1 робот' : `${calc.postCount} пост(ов)`}
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-border/50 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <CostContent state={state} onUpdateStep10={onUpdateStep10} calc={calc} isRobot={isRobot} robotMontagePrice={data.getSetting('montage_robot_fixed', 370000)} />
          </div>
        </div>
      )}
    </>
  );
}

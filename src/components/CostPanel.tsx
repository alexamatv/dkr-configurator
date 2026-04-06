'use client';

import { useState } from 'react';
import type { WizardState, Step10Data, MontageType } from '@/types';
import {
  profiles,
  bumModels,
  calcBumPrice,
  avdKits,
  osmosOptions,
  arasModels,
  vacuumOptions,
  dosatorOptions,
  robotModels,
  burModels,
  calcPaymentCost,
  boosterPumpPrice,
  truckWashTypes,
  kompakOptions,
  truckManualPostEquipment,
  truckManualPostMontage,
  truckWaterSystems,
  kompakMontagePrice,
} from '@/data/mockData';

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

function useMsoCalc(state: WizardState): CalcResult {
  const posts = state.posts.length > 0 ? state.posts : [];
  const postCount = Math.max(posts.length, 1);

  const profile = profiles.find((p) => p.id === state.step2.profile);
  const basePrice = profile?.basePrice ?? 0;

  const accessoriesPrice = state.step2.accessories
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + (a.customPrice !== undefined ? a.customPrice : a.price), 0);

  const kitPrice = basePrice + accessoriesPrice;

  const bumUpgrade = calcBumPrice(state.step3.bumModel, state.step2.profile);

  const paymentUpgrade = calcPaymentCost(state.step3.paymentSystems);

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

  const avdUpgrade = state.step5.avdSelections.reduce((sum, sel) => {
    const kit = avdKits.find((a) => a.id === sel.avdId);
    return sum + (kit?.price ?? 0);
  }, 0) + (state.step5.customPumpPrice || 0);

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
  const vacuumPrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;

  const washExtrasPrice = state.step9.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const pipelinesPrice =
    (state.step9.pipelinesAirPrice || 0) +
    (state.step9.pipelinesWaterPrice || 0) +
    (state.step9.pipelinesChemPrice || 0);

  const upgradesPerPost = bumUpgrade + paymentUpgrade + functionsPrice + avdUpgrade;
  const equipmentTotal = (kitPrice + upgradesPerPost) * postCount;
  const customWaterPrice = state.step7.customWaterPrice || 0;
  const boosterCost = state.step7.boosterPump ? boosterPumpPrice : 0;
  const softeningCost = (state.step7.softeningAll ? (state.step7.softeningAllPrice || 0) : 0)
    + (state.step7.softeningOsmos ? (state.step7.softeningOsmosPrice || 0) : 0);
  const waterTotal = osmosPrice + arasPrice + customWaterPrice + boosterCost + softeningCost;
  const washTotal = waterTotal + postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice;
  const subtotal = equipmentTotal + washTotal;

  return calcTotals(state, subtotal, postCount, 'пост(ов)', [
    ['Базовая комплектация', kitPrice * postCount],
    ['Оборудование (доплата)', (avdUpgrade + bumUpgrade) * postCount],
    ['Функции и опции', (functionsPrice + paymentUpgrade) * postCount],
    ['Водоподготовка', waterTotal],
    ['Доп. оборудование', postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice],
  ]);
}

function useRobotCalc(state: WizardState): CalcResult {
  const robot = robotModels.find((m) => m.id === state.robotStep2.robotModel);
  const robotPrice = robot?.price ?? 0;

  const bur = burModels.find((b) => b.id === state.robotStep3.burModel);
  const burPrice = bur?.price ?? 0;

  // Robot options
  const guidesIncluded = ['premium_360', 'cosmo_360'].includes(state.robotStep2.robotModel);
  const sideBlowerCost = state.robotStep4.sideBlowerEnabled ? (state.robotStep4.sideBlowerPrice || 0) : 0;
  const guidesCost = (!guidesIncluded && state.robotStep4.guidesEnabled) ? (state.robotStep4.guidesPrice || 0) : 0;
  const optionsTotal = sideBlowerCost + guidesCost;

  // Water (reuses step7)
  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const osmosPrice = osmos?.price ?? 0;
  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;
  const customWaterPrice = state.step7.customWaterPrice || 0;
  const boosterCost = state.step7.boosterPump ? boosterPumpPrice : 0;
  const softeningCost = (state.step7.softeningAll ? (state.step7.softeningAllPrice || 0) : 0)
    + (state.step7.softeningOsmos ? (state.step7.softeningOsmosPrice || 0) : 0);
  const waterTotal = osmosPrice + arasPrice + customWaterPrice + boosterCost + softeningCost;

  // Wash extras (reuses step9)
  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacuumPrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;
  const washExtrasPrice = state.step9.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);
  const pipelinesPrice =
    (state.step9.pipelinesAirPrice || 0) +
    (state.step9.pipelinesWaterPrice || 0) +
    (state.step9.pipelinesChemPrice || 0);
  const equipTotal = vacuumPrice + washExtrasPrice + pipelinesPrice;

  const subtotal = robotPrice + burPrice + optionsTotal + waterTotal + equipTotal;

  return calcTotals(state, subtotal, 1, 'робот', [
    ['Модель робота', robotPrice],
    ['БУР', burPrice],
    ['Опции робота', optionsTotal],
    ['Водоподготовка', waterTotal],
    ['Доп. оборудование', equipTotal],
  ]);
}

function useTruckCalc(state: WizardState): CalcResult {
  const truckType = truckWashTypes.find((t) => t.id === state.truckStep2.selectedType);
  const basePrice = truckType?.price ?? 0;
  const isKompak = state.truckStep2.selectedType === 'kompak';

  // Options
  let optionsPrice = 0;
  if (isKompak) {
    optionsPrice = state.truckStep3.selectedOptions.reduce((sum, optId) => {
      const opt = kompakOptions.find((o) => o.id === optId);
      return sum + (opt?.price ?? 0);
    }, 0);
  } else {
    optionsPrice = state.truckStep3.customOptionsPrice || 0;
  }

  // Manual post
  let manualPostPrice = 0;
  if (state.truckStep4.manualPostEnabled) {
    const avdItem = truckManualPostEquipment.find((e) => e.id === 'avd');
    const hangerItem = truckManualPostEquipment.find((e) => e.id === 'cable_hanger');
    manualPostPrice = (avdItem?.price ?? 0) * state.truckStep4.avdCount
      + (hangerItem?.price ?? 0) * state.truckStep4.hangerCount
      + truckManualPostMontage;
  }

  // Water
  const waterSys = truckWaterSystems.find((w) => w.id === state.truckStep5.selectedWater);
  const waterPrice = (waterSys?.price ?? 0) + (state.truckStep5.selectedWater === 'custom' ? (state.truckStep5.customWaterPrice || 0) : 0);

  const subtotal = basePrice + optionsPrice + manualPostPrice + waterPrice;

  // For КОМПАК: fixed montage instead of percentage
  const lines: [string, number][] = [
    ['Мойка', basePrice],
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

  return calcTotals(state, subtotal, 1, 'грузовая мойка', lines);
}

function calcTotals(
  state: WizardState,
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
  const montageRate = montage === 'commissioning' ? 0.05 : montage === 'full' ? 0.1 : 0;
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
}: {
  state: WizardState;
  onUpdateStep10: (data: Step10Data) => void;
  calc: CalcResult;
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
        <div key={label} className="flex justify-between">
          <span className="text-muted">{label}</span>
          <span className="font-medium">{fmt(value)}</span>
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
          <span className={`font-medium ${discountAmount > 0 ? 'text-success' : ''}`}>
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
            <span className="font-medium">
              {vatEnabled ? fmt(vatAmount) : 'не применяется'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Монтаж</span>
            <span className="font-medium">{fmt(montageAmount)}</span>
          </div>
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
        </div>

      </div>

      <div className="border-t border-border pt-3">
        <div className="flex justify-between text-lg font-bold">
          <span>ИТОГО</span>
          <span className="text-accent">{fmt(total)}</span>
        </div>
        {postCount > 0 && (
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{postCount > 1 ? `Цена на 1 ${unitLabel}` : ''}</span>
            <span>{postCount > 1 ? fmt(total / postCount) : ''}</span>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRobot = state.step1.objectType === 'robotic';
  const isTruck = state.step1.objectType === 'truck';
  const calc = isTruck ? useTruckCalc(state) : isRobot ? useRobotCalc(state) : useMsoCalc(state);

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
        <CostContent state={state} onUpdateStep10={onUpdateStep10} calc={calc} />
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
            className="flex-shrink-0 bg-black/60"
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
            <CostContent state={state} onUpdateStep10={onUpdateStep10} calc={calc} />
          </div>
        </div>
      )}
    </>
  );
}

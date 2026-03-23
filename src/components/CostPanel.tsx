'use client';

import type { WizardState, Step10Data, MontageType } from '@/types';
import {
  profiles,
  bumModels,
  paymentSystemPrices,
  avdKits,
  osmosOptions,
  arasModels,
  vacuumOptions,
} from '@/data/mockData';

interface CostPanelProps {
  state: WizardState;
  onUpdateStep10: (data: Step10Data) => void;
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

export function CostPanel({ state, onUpdateStep10 }: CostPanelProps) {
  const posts = state.posts.length > 0 ? state.posts : [];
  const postCount = Math.max(posts.length, 1);

  const profile = profiles.find((p) => p.id === state.step2.profile);
  const profilePrice = profile?.price ?? 0;

  const accessoriesPrice = state.step2.accessories
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.price, 0);

  const bum = bumModels.find((b) => b.id === state.step3.bumModel);
  const bumPrice = bum?.price ?? 0;

  const paymentPrice = state.step3.paymentSystems.reduce(
    (sum, ps) => sum + (paymentSystemPrices[ps] ?? 0),
    0
  );

  const functionsPrice = state.step4.functions
    .filter((f) => !f.isBase && f.option && f.option !== 'none')
    .reduce((sum, f) => {
      if (f.option === 'button_only') return sum + f.buttonPrice;
      if (f.option === 'button_and_kit') return sum + f.buttonPrice + f.kitPrice;
      return sum;
    }, 0);

  const avd = avdKits.find((a) => a.id === state.step5.avdKit);
  const avdPrice = avd?.price ?? 0;

  const osmos = osmosOptions.find((o) => o.id === state.step7.osmosOption);
  const osmosPrice = osmos?.price ?? 0;

  const aras = arasModels.find((a) => a.id === state.step7.arasModel);
  const arasPrice = aras && 'price' in aras ? (aras as { price: number }).price : 0;

  const postExtrasPrice = state.step8.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const vac = vacuumOptions.find((v) => v.id === state.step9.vacuumOption);
  const vacuumPrice = (vac?.price ?? 0) * state.step9.vacuumQuantity;

  const washExtrasPrice = state.step9.extras
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const pipelinesPrice =
    state.step9.pipelines.air * 500 +
    state.step9.pipelines.water * 700 +
    state.step9.pipelines.chemical * 900;

  const equipmentTotal = (profilePrice + accessoriesPrice + bumPrice + paymentPrice + functionsPrice + avdPrice) * postCount;
  const washTotal = osmosPrice + arasPrice + postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice;
  const subtotal = equipmentTotal + washTotal;

  const discountPct = state.step10.discount;
  const discountFrac = discountPct / 100;
  const discountAmount = subtotal * discountFrac;
  const afterDiscount = subtotal - discountAmount;

  const vatPct = state.step10.vat;
  const vatAmount = afterDiscount * (vatPct / 100);

  const montage = state.step10.montage;
  const montageRate = montage === 'commissioning' ? 0.05 : montage === 'full' ? 0.1 : 0;
  const montageAmount = afterDiscount * montageRate;

  const regionalCoeff = state.step10.regionalCoefficient;
  const total = (afterDiscount + vatAmount + montageAmount) * regionalCoeff;

  const update10 = (patch: Partial<Step10Data>) =>
    onUpdateStep10({ ...state.step10, ...patch });

  const lines: [string, number][] = [
    ['Базовая комплектация', profilePrice * postCount],
    ['Оборудование', (avdPrice + bumPrice) * postCount],
    ['Функции', (functionsPrice + accessoriesPrice + paymentPrice) * postCount],
    ['Водоподготовка', osmosPrice + arasPrice],
    ['Доп. опции', postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice],
  ];

  const montageOptions: { value: MontageType; label: string }[] = [
    { value: 'none', label: 'Нет' },
    { value: 'commissioning', label: '5%' },
    { value: 'full', label: '10%' },
  ];

  return (
    <div className="w-[300px] shrink-0 bg-surface border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Расчёт стоимости</h3>
        <p className="text-xs text-muted mt-1">{postCount} пост(ов)</p>
      </div>
      <div className="p-4 space-y-3 text-sm">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted">{label}</span>
            <span className="font-medium">{fmt(value)}</span>
          </div>
        ))}

        <div className="border-t border-border pt-3 space-y-3">
          {/* Скидка — всегда видна, с инлайн-полем */}
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

          {/* НДС */}
          <div className="flex justify-between">
            <span className="text-muted">НДС {vatPct}%</span>
            <span className="font-medium">{fmt(vatAmount)}</span>
          </div>

          {/* Монтаж — всегда видна, инлайн-выбор */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted">Монтаж</span>
              <span className="font-medium">{fmt(montageAmount)}</span>
            </div>
            <div className="flex gap-1">
              {montageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update10({ montage: opt.value })}
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
          </div>

          {/* Региональный коэффициент — всегда виден, с инлайн-полем */}
          <div className="flex items-center justify-between">
            <span className="text-muted">Рег. коэфф.</span>
            <div className="flex items-center gap-1">
              <span className="text-muted text-xs">×</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={regionalCoeff}
                onChange={(e) => update10({ regionalCoefficient: parseFloat(e.target.value) || 1 })}
                className="w-16 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span>ИТОГО</span>
            <span className="text-accent">{fmt(total)}</span>
          </div>
          {postCount > 0 && (
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Цена на 1 пост</span>
              <span>{fmt(total / postCount)}</span>
            </div>
          )}
        </div>

        <button className="w-full mt-4 py-2 px-4 bg-accent/20 text-accent text-sm font-medium rounded hover:bg-accent/30 transition-colors">
          Детальный расчёт
        </button>
      </div>
    </div>
  );
}

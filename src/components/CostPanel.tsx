'use client';

import type { WizardState } from '@/types';
import {
  profiles,
  bumModels,
  paymentSystemPrices,
  avdKits,
  osmosOptions,
  arasModels,
  defaultPostExtras,
  vacuumOptions,
  defaultWashExtras,
} from '@/data/mockData';

interface CostPanelProps {
  state: WizardState;
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

export function CostPanel({ state }: CostPanelProps) {
  const posts = state.posts.length > 0 ? state.posts : [];
  const postCount = Math.max(posts.length, 1);

  // Per-post costs (current config if no posts yet)
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

  const singlePostTotal = profilePrice + accessoriesPrice + bumPrice + paymentPrice + functionsPrice + avdPrice;

  // Wash-level costs
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

  const equipmentTotal = singlePostTotal * postCount;
  const washTotal = osmosPrice + arasPrice + postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice;
  const subtotal = equipmentTotal + washTotal;

  const discount = state.step10.discount / 100;
  const afterDiscount = subtotal * (1 - discount);
  const vat = afterDiscount * (state.step10.vat / 100);
  const montageRate = state.step10.montage === 'commissioning' ? 0.05 : state.step10.montage === 'full' ? 0.1 : 0;
  const montagePrice = afterDiscount * montageRate;
  const regionalCoeff = state.step10.regionalCoefficient;
  const total = (afterDiscount + vat + montagePrice) * regionalCoeff;

  const lines: [string, number][] = [
    ['Базовая комплектация', profilePrice * postCount],
    ['Оборудование', (avdPrice + bumPrice) * postCount],
    ['Функции', (functionsPrice + accessoriesPrice + paymentPrice) * postCount],
    ['Водоподготовка', osmosPrice + arasPrice],
    ['Доп. опции', postExtrasPrice + vacuumPrice + washExtrasPrice + pipelinesPrice],
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

        <div className="border-t border-border pt-3 space-y-2">
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Скидка {state.step10.discount}%</span>
              <span>−{fmt(subtotal * discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">НДС {state.step10.vat}%</span>
            <span>{fmt(vat)}</span>
          </div>
          {montageRate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">
                {state.step10.montage === 'commissioning' ? 'Пусконаладка 5%' : 'Монтаж 10%'}
              </span>
              <span>{fmt(montagePrice)}</span>
            </div>
          )}
          {regionalCoeff !== 1 && (
            <div className="flex justify-between">
              <span className="text-muted">Рег. коэфф. ×{regionalCoeff}</span>
              <span></span>
            </div>
          )}
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

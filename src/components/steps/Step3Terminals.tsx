'use client';

import type { Step3Data, PaymentSystem } from '@/types';
import { bumModels, getDefaultBumForProfile, paymentSystemLabels, paymentSystemPrices, basePaymentSystems, paymentSystemRemovalDiscounts, paymentSystemFullPrices } from '@/data/mockData';

interface Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
  profile: string;
}

const paymentSystems: PaymentSystem[] = ['bill_acceptor', 'coin_acceptor', 'loyalty_reader', 'acquiring', 'qr_payment'];

export function Step3Terminals({ data, onChange, profile }: Props) {
  const defaultBumId = getDefaultBumForProfile(profile);
  const togglePayment = (ps: PaymentSystem) => {
    const has = data.paymentSystems.includes(ps);
    onChange({
      ...data,
      paymentSystems: has
        ? data.paymentSystems.filter((p) => p !== ps)
        : [...data.paymentSystems, ps],
    });
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 3. Терминалы / БУМы</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Модель БУМа</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[820px]">
          {bumModels.map((b) => {
            const isDefault = b.id === defaultBumId;
            return (
              <button
                key={b.id}
                onClick={() => onChange({ ...data, bumModel: b.id })}
                className={`radio-card ${data.bumModel === b.id ? 'selected' : ''}`}
              >
                <div className="w-full h-24 bg-border/30 rounded mb-3 flex items-center justify-center text-3xl text-muted">
                  📟
                </div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-muted mt-1">{b.description}</div>
                <div className="text-xs text-accent mt-1">До {b.maxButtons} кнопок</div>
                <div className="text-xs text-muted mt-1">Терминал: {b.realPrice.toLocaleString('ru-RU')} ₽</div>
                {isDefault ? (
                  <div className="text-success font-bold text-lg mt-2">Входит в комплект</div>
                ) : (
                  <div className="text-accent font-bold text-lg mt-2">
                    {b.realPrice.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Система оплаты</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentSystems.map((ps) => {
            const selected = data.paymentSystems.includes(ps);
            const isBase = basePaymentSystems.includes(ps);
            const removalDiscount = paymentSystemRemovalDiscounts[ps] ?? 0;
            const addPrice = paymentSystemPrices[ps] ?? 0;
            const fullPrice = paymentSystemFullPrices[ps] ?? 0;
            return (
              <label
                key={ps}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePayment(ps)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-accent bg-accent' : 'border-border'
                  }`}
                >
                  {selected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium">{paymentSystemLabels[ps]}</div>
                  {isBase ? (
                    <>
                      <div className="text-xs text-success">В комплекте ({fullPrice.toLocaleString('ru-RU')} ₽)</div>
                      {!selected && (
                        <div className="text-xs text-danger">−{removalDiscount.toLocaleString('ru-RU')} ₽ при снятии</div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-muted">+{addPrice.toLocaleString('ru-RU')} ₽</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        data.customDesign ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50'
      }`}>
        <input
          type="checkbox"
          checked={data.customDesign}
          onChange={() => onChange({ ...data, customDesign: !data.customDesign })}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          data.customDesign ? 'border-accent bg-accent' : 'border-border'
        }`}>
          {data.customDesign && <span className="text-white text-xs">✓</span>}
        </div>
        <div className="text-sm font-medium">Индивидуальный дизайн</div>
      </label>
    </div>
  );
}

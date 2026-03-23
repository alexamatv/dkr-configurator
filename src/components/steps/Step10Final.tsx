'use client';

import type { Step10Data, PostConfig } from '@/types';
import { profiles, bumModels, regions } from '@/data/mockData';

interface Props {
  data: Step10Data;
  posts: PostConfig[];
  onChange: (data: Step10Data) => void;
  onEditPost: (index: number) => void;
  onDuplicatePost: (index: number) => void;
  onDeletePost: (index: number) => void;
}

export function Step10Final({ data, posts, onChange, onEditPost, onDuplicatePost, onDeletePost }: Props) {
  const update = (patch: Partial<Step10Data>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 10. Финализация</h2>

      {posts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-muted mb-3">Сводка по постам</label>
          <div className="space-y-2">
            {posts.map((post, idx) => {
              const profile = profiles.find((p) => p.id === post.profile);
              const bum = bumModels.find((b) => b.id === post.bumModel);
              return (
                <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-surface border border-border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-bold text-accent shrink-0">#{idx + 1}</span>
                    <span className="text-sm truncate">
                      {profile?.name} • {bum?.name} • {post.functions.filter((f) => f.isBase ? f.enabled : f.option !== 'none').length} функций
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => onEditPost(idx)} className="text-xs text-accent hover:underline">Изменить</button>
                    <button onClick={() => onDuplicatePost(idx)} className="text-xs text-muted hover:underline">Дублировать</button>
                    <button onClick={() => onDeletePost(idx)} className="text-xs text-danger hover:underline">Удалить</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Условия доставки</label>
          <textarea
            value={data.deliveryConditions}
            onChange={(e) => update({ deliveryConditions: e.target.value })}
            rows={3}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            placeholder="Введите условия доставки..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Условия оплаты</label>
          <textarea
            value={data.paymentConditions}
            onChange={(e) => update({ paymentConditions: e.target.value })}
            rows={3}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            placeholder="Введите условия оплаты..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Регион доставки</label>
          <select
            value={data.region}
            onChange={(e) => update({ region: e.target.value as Step10Data['region'] })}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Валюта</label>
          <select
            value={data.currency}
            onChange={(e) => update({ currency: e.target.value as Step10Data['currency'] })}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="RUB">RUB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Скидка %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={data.discount}
            onChange={(e) => update({ discount: parseFloat(e.target.value) || 0 })}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">НДС %</label>
          <input
            type="number"
            min={0}
            value={data.vat}
            onChange={(e) => update({ vat: parseFloat(e.target.value) || 0 })}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Рег. коэффициент</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={data.regionalCoefficient}
            onChange={(e) => update({ regionalCoefficient: parseFloat(e.target.value) || 1 })}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Монтаж</label>
        <div className="flex gap-3">
          {([
            ['none', 'Не выбран'],
            ['commissioning', 'Пусконаладка 5%'],
            ['full', 'Полный монтаж 10%'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => update({ montage: value })}
              className={`radio-card flex-1 text-center text-sm ${data.montage === value ? 'selected' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Язык КП</label>
        <div className="flex gap-3">
          {([['ru', 'Русский'], ['en', 'English']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => update({ language: value })}
              className={`radio-card flex-1 text-center text-sm ${data.language === value ? 'selected' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
        <button className="px-5 py-2.5 bg-accent text-white font-medium rounded hover:bg-accent-hover transition-colors">
          Сохранить черновик
        </button>
        <button className="px-5 py-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-colors text-muted">
          Скачать PDF (заглушка)
        </button>
        <button className="px-5 py-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-colors text-muted">
          Скачать Excel (заглушка)
        </button>
        <button className="px-5 py-2.5 bg-surface border border-border rounded hover:bg-surface-hover transition-colors text-muted">
          Сохранить как шаблон (заглушка)
        </button>
      </div>
    </div>
  );
}

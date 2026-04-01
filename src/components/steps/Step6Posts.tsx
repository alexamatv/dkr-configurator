'use client';

import { useState } from 'react';
import type { PostConfig } from '@/types';
import {
  profiles,
  bumModels,
  avdKits,
  dosatorOptions,
  calcPaymentCost,
} from '@/data/mockData';

interface Props {
  posts: PostConfig[];
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onCopyCurrent: (count: number) => void;
  onCreateNew: () => void;
  onFinish: () => void;
  onUpdatePost: (index: number, post: PostConfig) => void;
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function calcPostPrice(post: PostConfig): number {
  const profile = profiles.find((p) => p.id === post.profile);
  const basePrice = profile?.basePrice ?? 0;

  const accessoriesPrice = post.accessories
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + (a.customPrice !== undefined ? a.customPrice : a.price), 0);

  const bumUpgrade = bumModels.find((b) => b.id === post.bumModel)?.price ?? 0;

  const paymentUpgrade = calcPaymentCost(post.paymentSystems);

  const functionsPrice = post.functions
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

  const avdUpgrade = post.avdSelections.reduce((sum, sel) => {
    const kit = avdKits.find((a) => a.id === sel.avdId);
    return sum + (kit?.price ?? 0);
  }, 0);

  return basePrice + accessoriesPrice + bumUpgrade + paymentUpgrade + functionsPrice + avdUpgrade;
}

export function Step6Posts({
  posts,
  onEdit,
  onDuplicate,
  onDelete,
  onCopyCurrent,
  onCreateNew,
  onFinish,
  onUpdatePost,
}: Props) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  const startEditing = (postId: string, currentName: string) => {
    setEditingName(postId);
    setNameValue(currentName);
  };

  const saveName = (idx: number, post: PostConfig) => {
    const trimmed = nameValue.trim();
    onUpdatePost(idx, { ...post, customName: trimmed || undefined });
    setEditingName(null);
  };

  const getDefaultName = (idx: number, post: PostConfig) => {
    const profile = profiles.find((p) => p.id === post.profile);
    return `Пост #${idx + 1} — ${profile?.name ?? 'Без профиля'}`;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 6. Формирование постов</h2>

      <div className="flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg">
        <span className="text-2xl font-bold text-accent">{posts.length}</span>
        <span className="text-sm font-medium text-muted">
          {posts.length === 1 ? 'пост в конфигурации' : posts.length >= 2 && posts.length <= 4 ? 'поста в конфигурации' : 'постов в конфигурации'}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-4xl mb-4">📋</div>
          <p>Нет сохранённых постов</p>
          <p className="text-sm mt-2">Сохраните текущую конфигурацию или создайте новый пост</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, idx) => {
            const profile = profiles.find((p) => p.id === post.profile);
            const bum = bumModels.find((b) => b.id === post.bumModel);
            const funcCount = post.functions.filter(
              (f) => f.isBase ? f.enabled : f.option !== 'none'
            ).length;
            const price = calcPostPrice(post);
            const displayName = post.customName || getDefaultName(idx, post);
            const isEditing = editingName === post.id;

            return (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onBlur={() => saveName(idx, post)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveName(idx, post);
                            if (e.key === 'Escape') setEditingName(null);
                          }}
                          className="flex-1 min-w-0 bg-background border border-accent rounded px-2 py-0.5 text-sm font-medium focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(post.id, displayName)}
                          className="font-medium truncate cursor-pointer hover:text-accent transition-colors"
                          title="Нажмите, чтобы переименовать"
                        >
                          {displayName}
                        </div>
                      )}
                      <span className="shrink-0 text-sm font-bold text-accent">
                        {fmt(price)}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {post.vehicleType === 'passenger' ? 'Легковой' : 'Грузовой'} •{' '}
                      {bum?.name ?? '—'} • {funcCount} функций
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 sm:ml-0 ml-[52px]">
                  <button
                    onClick={() => onEdit(idx)}
                    className="px-3 py-1.5 text-xs bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => onDuplicate(idx)}
                    className="px-3 py-1.5 text-xs bg-surface-hover text-muted rounded hover:text-foreground transition-colors"
                  >
                    Дублировать
                  </button>
                  <button
                    onClick={() => onDelete(idx)}
                    className="px-3 py-1.5 text-xs bg-danger/20 text-danger rounded hover:bg-danger/30 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            const count = parseInt(prompt('Количество копий:') || '1');
            if (count > 0) onCopyCurrent(count);
          }}
          className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent-hover transition-colors"
        >
          Скопировать текущий пост
        </button>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-surface border border-border text-sm rounded hover:bg-surface-hover transition-colors"
        >
          Создать новый пост
        </button>
        <button
          disabled
          className="px-4 py-2 bg-surface border border-border text-sm rounded text-muted cursor-not-allowed"
        >
          Добавить робота (заглушка)
        </button>
      </div>

      {posts.length > 0 && (
        <button
          onClick={onFinish}
          className="w-full py-3 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
        >
          Завершить формирование постов →
        </button>
      )}
    </div>
  );
}

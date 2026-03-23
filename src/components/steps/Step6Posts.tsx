'use client';

import type { PostConfig } from '@/types';
import { profiles, bumModels } from '@/data/mockData';

interface Props {
  posts: PostConfig[];
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onCopyCurrent: (count: number) => void;
  onCreateNew: () => void;
  onFinish: () => void;
}

export function Step6Posts({
  posts,
  onEdit,
  onDuplicate,
  onDelete,
  onCopyCurrent,
  onCreateNew,
  onFinish,
}: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 6. Формирование постов</h2>

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
            return (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    Пост #{idx + 1} — {profile?.name ?? 'Без профиля'}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {post.vehicleType === 'passenger' ? 'Легковой' : 'Грузовой'} •{' '}
                    {bum?.name ?? '—'} • {funcCount} функций
                  </div>
                </div>
                <div className="flex gap-2">
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

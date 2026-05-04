'use client';

/**
 * Catch-all rendering of admin-created `extra_equipment` rows whose category
 * isn't already shown in a dedicated step. Groups items by category, renders
 * checkbox or radio cards based on each row's `selectionType`. Used by both
 * RobotStep4Options and TruckStep3Options so they share the same UX.
 *
 * Selection state is stored on the parent step as `customSelections`:
 *   Record<category, string[]>
 * — an array of selected ids per category. Empty array = "Нет" for radio.
 */

import { ZoomableImage } from '@/components/ui/ZoomableImage';
import type { CustomExtraItem } from '@/services/dataService';

interface Props {
  /** Section heading shown above the groups. */
  title?: string;
  items: CustomExtraItem[];
  /** Map from category → selected ids in that category. */
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}

// Friendly labels for known custom-style categories. Anything else falls
// back to its raw category id so the admin sees what they typed.
const CATEGORY_LABELS: Record<string, string> = {
  robot_heating: 'Подогрев',
  robot_chem: 'Дополнительная химия',
  truck_extra: 'Прочее оборудование',
};

const labelFor = (cat: string) => CATEGORY_LABELS[cat] ?? cat;

export function CustomExtrasSection({ title, items, value, onChange }: Props) {
  if (items.length === 0) return null;

  // Group by category, preserving DB order (rows are sorted by sort_order
  // in dataService).
  const byCategory = new Map<string, CustomExtraItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const setSelections = (category: string, ids: string[]) => {
    onChange({ ...value, [category]: ids });
  };

  return (
    <div className="space-y-6">
      {title && (
        <label className="block text-sm font-medium text-muted">{title}</label>
      )}

      {Array.from(byCategory.entries()).map(([category, rows]) => {
        // A category's selection_type is taken from its first row. Mixed
        // selection_type within a single category is unsupported by design
        // (admin should keep them homogeneous).
        const isRadio = rows[0].selectionType === 'radio';
        const selected = value[category] ?? [];

        const toggleCheckbox = (id: string) => {
          const next = selected.includes(id)
            ? selected.filter((s) => s !== id)
            : [...selected, id];
          setSelections(category, next);
        };

        const pickRadio = (id: string) => {
          // Empty id = "Нет" → store empty array.
          setSelections(category, id ? [id] : []);
        };

        return (
          <div key={category}>
            <div className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">
              {labelFor(category)}
            </div>

            {isRadio ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Implicit "Нет" choice for radio groups. */}
                <button
                  key="__none__"
                  onClick={() => pickRadio('')}
                  className={`radio-card flex items-center gap-3 ${
                    selected.length === 0 ? 'selected' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium">Нет</div>
                  </div>
                </button>

                {rows.map((row) => {
                  const isOn = selected.includes(row.id);
                  return (
                    <button
                      key={row.id}
                      onClick={() => pickRadio(row.id)}
                      className={`radio-card flex items-center gap-3 ${isOn ? 'selected' : ''}`}
                    >
                      {row.imageUrl && (
                        <div className="relative w-16 h-16 shrink-0 bg-background/40 rounded">
                          <ZoomableImage
                            src={row.imageUrl}
                            alt={row.name}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium">{row.name}</div>
                        {row.price > 1 && (
                          <div className="text-accent text-sm font-bold mt-1">
                            {row.price.toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => {
                  const isOn = selected.includes(row.id);
                  return (
                    <label
                      key={row.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isOn ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggleCheckbox(row.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          isOn ? 'border-accent bg-accent' : 'border-border'
                        }`}
                      >
                        {isOn && <span className="text-white text-xs">✓</span>}
                      </div>
                      {row.imageUrl && (
                        <div className="relative w-12 h-12 shrink-0 bg-background/40 rounded">
                          <ZoomableImage
                            src={row.imageUrl}
                            alt={row.name}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{row.name}</div>
                      </div>
                      {row.price > 1 && (
                        <div className="text-accent font-bold text-sm shrink-0">
                          {row.price.toLocaleString('ru-RU')} ₽
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

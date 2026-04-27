'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  title: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export function PhotoUploadModal({ title, onClose, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pick = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Поддерживаются только JPG, PNG и WebP.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('Файл больше 2 МБ.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm">Фото — {title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-hover text-muted"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
          >
            {preview ? (
              <div className="flex flex-col items-center gap-2">
                <Image
                  src={preview}
                  alt="preview"
                  width={200}
                  height={150}
                  unoptimized
                  className="max-h-[180px] w-auto object-contain rounded"
                />
                <div className="text-xs text-muted">{file?.name}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl">📷</div>
                <div className="text-sm">Перетащите файл сюда или кликните, чтобы выбрать</div>
                <div className="text-xs text-muted">JPG, PNG, WebP — до 2 МБ</div>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {error && <div className="text-xs text-danger">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-1.5 text-sm border border-border rounded hover:bg-surface-hover disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={() => void submit()}
            disabled={uploading || !file}
            className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {uploading ? 'Загружаем…' : 'Загрузить'}
          </button>
        </div>
      </div>
    </div>
  );
}

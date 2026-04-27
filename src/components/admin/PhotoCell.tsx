'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { PhotoUploadModal } from './PhotoUploadModal';
import { removePhoto, uploadPhoto } from './photoStorage';

interface Props {
  table: string;
  id: string;
  name: string;
  imageUrl: string | null;
  showImageInKp: boolean;
  onChange: (patch: { image_url?: string | null; show_image_in_kp?: boolean }) => Promise<void>;
}

export function PhotoCell({ table, id, name, imageUrl, showImageInKp, onChange }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const { publicUrl } = await uploadPhoto(supabase, table, id, file, imageUrl);
      await onChange({ image_url: publicUrl });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    if (!confirm('Удалить фото?')) return;
    setBusy(true);
    try {
      await removePhoto(supabase, imageUrl);
      await onChange({ image_url: null, show_image_in_kp: false });
    } finally {
      setBusy(false);
    }
  };

  const toggleInKp = async (next: boolean) => {
    setBusy(true);
    try {
      await onChange({ show_image_in_kp: next });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={48}
          height={48}
          className="w-12 h-12 object-cover rounded border border-border"
          unoptimized
        />
      ) : (
        <div className="w-12 h-12 rounded border border-border bg-background/40 flex items-center justify-center text-muted text-lg">
          📷
        </div>
      )}

      <div className="flex flex-col gap-1">
        {imageUrl ? (
          <>
            <div className="flex gap-1">
              <button
                onClick={() => setUploadOpen(true)}
                disabled={busy}
                className="text-[11px] px-1.5 py-0.5 border border-border rounded hover:border-accent hover:text-accent disabled:opacity-50"
              >
                Заменить
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={busy}
                className="text-[11px] px-1.5 py-0.5 border border-border rounded hover:border-danger hover:text-danger disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showImageInKp}
                onChange={(e) => void toggleInKp(e.target.checked)}
                disabled={busy}
                className="w-3 h-3 accent-accent"
              />
              В КП
            </label>
          </>
        ) : (
          <button
            onClick={() => setUploadOpen(true)}
            disabled={busy}
            className="text-[11px] px-2 py-1 border border-border rounded hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Загрузить
          </button>
        )}
      </div>

      {uploadOpen && (
        <PhotoUploadModal
          title={name}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

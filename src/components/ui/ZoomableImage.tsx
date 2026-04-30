'use client';

import { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';

/**
 * Drop-in replacement for next/image that opens a fullscreen lightbox on click.
 * Same prop surface as <Image>; the click handler is wired internally.
 *
 * - cursor-zoom-in on hover
 * - Click background, ✕, or Escape to close
 * - Locks body scroll while open
 * - Click on the image inside the lightbox doesn't bubble — only background clicks close
 */
export function ZoomableImage(props: ImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const { className, alt, ...rest } = props;
  const altText = typeof alt === 'string' ? alt : '';
  const fullSrc = typeof props.src === 'string' ? props.src : '';

  return (
    <>
      <Image
        {...rest}
        alt={alt}
        onClick={(e) => {
          // Don't let the underlying card/button take the click — the user
          // explicitly asked to zoom, not select.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`cursor-zoom-in ${className ?? ''}`}
      />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
          >
            {fullSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullSrc}
                alt={altText}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded shadow-2xl"
              />
            )}
            {altText && (
              <div className="text-white text-sm text-center max-w-[90vw]">{altText}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

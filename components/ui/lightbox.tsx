'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

interface LightboxProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

/**
 * Lightbox component that wraps an image and shows it fullscreen when clicked
 */
export function Lightbox({ src, alt, children }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(typeof window !== 'undefined');

  const openLightbox = useCallback(() => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeLightbox();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeLightbox]);

  // Clean up overflow style on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const overlay = isOpen && mounted ? createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={closeLightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Enlarged image: ${alt}`}
    >
      {/* Close button */}
      <button
        onClick={closeLightbox}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close lightbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="90vw"
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
        {alt && (
          <p className="mt-3 text-center text-white/70 text-sm">{alt}</p>
        )}
      </div>

      {/* Click hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Click anywhere or press Escape to close
      </p>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={openLightbox}
        className="cursor-zoom-in w-full block"
        aria-label={`View ${alt} in fullscreen`}
      >
        {children}
      </button>
      {overlay}
    </>
  );
}

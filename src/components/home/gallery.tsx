"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import type { MarketingGalleryCard } from "@/lib/marketing-content";

const GALLERY_FALLBACK_SOURCES = [
  "/images/imaginegallery/abruzzo.png",
  "/images/imaginegallery/castellmare%20di%20stabbia.png",
  "/images/imaginegallery/costiera%20amalfitana.png",
  "/images/imaginegallery/napoli.png",
  "/images/imaginegallery/romania.png",
  "/images/imaginegallery/toscana.png",
];

export function Gallery({ items }: { items: MarketingGalleryCard[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const hasItems = items.length > 0;
  const activeItem = useMemo(
    () => (activeIndex == null || !hasItems ? null : items[activeIndex]),
    [activeIndex, hasItems, items],
  );

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const showPrevious = useCallback(() => {
    if (!hasItems || activeIndex == null) return;
    setActiveIndex((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, hasItems, items.length]);
  const showNext = useCallback(() => {
    if (!hasItems || activeIndex == null) return;
    setActiveIndex((activeIndex + 1) % items.length);
  }, [activeIndex, hasItems, items.length]);

  const resolvedSrc = useCallback(
    (img: MarketingGalleryCard) => imageOverrides[img.id] ?? img.src,
    [imageOverrides],
  );

  const handleImageError = useCallback(
    (imgId: string, index: number) => {
      setImageOverrides((prev) => {
        if (prev[imgId]) return prev;
        return {
          ...prev,
          [imgId]: GALLERY_FALLBACK_SOURCES[index % GALLERY_FALLBACK_SOURCES.length],
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (activeIndex == null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, showNext, showPrevious]);

  return (
    <section className="section-padding section-gap bg-white">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          title="Make Your Memories"
          subtitle="Every shot is a promise of the beauty you will encounter — captured during our real explorations."
        />

        <div className="mt-6">
          <HorizontalSlider ariaLabel="Travel gallery" gapPx={10}>
            {items.map((img, index) => (
              <div
                key={img.id}
                className="snap-start shrink-0 w-[90%] sm:w-[52%] md:w-[39%] lg:w-[31%] aspect-[4/3] relative rounded-2xl overflow-hidden group cursor-pointer card-shadow"
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="absolute inset-0 text-left"
                  aria-label={`Open gallery image: ${img.location}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedSrc(img)}
                    alt={img.alt}
                    onError={() => handleImageError(img.id, index)}
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-[800ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="mb-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white">
                      {img.location}
                    </p>
                  </div>

                  <div className="absolute left-5 bottom-5 text-white group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-sm font-medium drop-shadow">
                      {img.location}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </HorizontalSlider>
        </div>
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-[70] bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
            aria-label="Close enlarged image"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 sm:left-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                aria-label="View previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                aria-label="View next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div
            className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedSrc(activeItem)}
              alt={activeItem.alt}
              onError={() => handleImageError(activeItem.id, activeIndex ?? 0)}
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
            />
            <p className="text-sm font-medium text-white/90">{activeItem.location}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

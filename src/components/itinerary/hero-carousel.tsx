"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroCarouselProps {
  images: string[];
  title: string;
  videoSrc?: string;
}

const AUTO_MS = 4500;

export function HeroCarousel({ images, title, videoSrc }: HeroCarouselProps) {
  const imageSlides = useMemo(
    () => (images.length > 0 ? images : ["/images/placeholder.jpg"]),
    [images],
  );
  const slides = useMemo(() => {
    return videoSrc ? [videoSrc, ...imageSlides] : imageSlides;
  }, [imageSlides, videoSrc]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  function goTo(next: number) {
    const normalized = (next + slides.length) % slides.length;
    setIndex(normalized);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX ?? null;
    touchStartX.current = null;
    if (start == null || end == null) return;
    const deltaX = end - start;
    // Ignore tiny finger movement to avoid accidental slide changes.
    if (Math.abs(deltaX) < 36) return;
    if (deltaX < 0) goTo(index + 1);
    if (deltaX > 0) goTo(index - 1);
  }

  return (
    <div
      className="group absolute inset-0 z-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 overflow-hidden">
            {videoSrc && i === 0 ? (
              <video
                key={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover"
                aria-label={`${title} hero video`}
              >
                <source src={src} type="video/mp4" />
              </video>
            ) : (
              <>
                {/* Backdrop layer keeps the frame cinematic without harsh crop. */}
                <Image
                  src={src}
                  alt={`${title} backdrop ${i + 1}`}
                  fill
                  priority={i <= 1}
                  className="object-cover blur-[1.25px] brightness-45"
                  sizes="100vw"
                  quality={90}
                />
                <Image
                  src={src}
                  alt={`${title} hero ${i + 1}`}
                  fill
                  priority={i <= 1}
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  quality={100}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-black/25 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-black/25 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-2 backdrop-blur-md transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {slides.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => goTo(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/55 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalSliderProps {
  children: React.ReactNode;
  ariaLabel?: string;
  /** gap in pixels between items (also used as scroll step padding) */
  gapPx?: number;
  /** Custom CSS classes for the track wrapper */
  trackClassName?: string;
  /** Custom CSS classes for the outer wrapper */
  className?: string;
  /** Arrow visual variant. "dark" (default) works on light backgrounds; "light" works on dark backgrounds or over images. */
  arrowVariant?: "dark" | "light";
}

/**
 * Horizontal scroller with transparent, minimalist left/right arrows.
 * Items should set their own widths (e.g. `min-w-[320px]` or `basis-[80%]`).
 */
export function HorizontalSlider({
  children,
  ariaLabel = "Horizontal slider",
  gapPx = 24,
  trackClassName = "",
  className = "",
  arrowVariant = "dark",
}: HorizontalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.85, 320);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const arrowClass =
    arrowVariant === "light"
      ? "backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/25"
      : "backdrop-blur-md bg-white/70 border border-black/10 text-[#1D1D1F] hover:bg-white/90";

  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canScrollLeft}
        aria-label={`${ariaLabel} — previous`}
        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${arrowClass}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canScrollRight}
        aria-label={`${ariaLabel} — next`}
        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${arrowClass}`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div
        ref={trackRef}
        className={`flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-2 touch-auto px-2 sm:px-4 ${trackClassName}`}
        style={{
          gap: `${gapPx}px`,
          scrollPaddingLeft: "1.25rem",
          scrollPaddingRight: "1.25rem",
          WebkitOverflowScrolling: "touch",
        }}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}

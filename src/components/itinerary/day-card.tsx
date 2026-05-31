"use client";

import { useState } from "react";
import { Headphones } from "lucide-react";
import { ItineraryMap } from "@/components/itinerary/itinerary-map";
import { StepAccordion } from "@/components/itinerary/step-accordion";
import type { ItineraryStep } from "@/types";

interface DayCardProps {
  day: number;
  title?: string;
  intro?: string;
  steps: ItineraryStep[];
}

/**
 * Renders a single day's plan: a sticky per-day map on top/right and the
 * day's color-coded step accordion. Selecting a step recenters the day map
 * via the shared activeStep state.
 */
export function DayCard({ day, title, intro, steps }: DayCardProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(
    steps[0]?.id ?? null,
  );
  const audioCount = steps.filter((step) => !!step.audioUrl).length;

  if (steps.length === 0) return null;

  return (
    <section
      id={`day-${day}`}
      className="rounded-3xl border border-black/[0.06] bg-white p-5 sm:p-7 shadow-sm scroll-mt-28"
    >
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/50">
          Day {day}
        </p>
        {title && (
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-foreground">
            {title}
          </h2>
        )}
        {intro && (
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/70 whitespace-pre-line">
            {intro}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
          <p>{steps.length} stops · tap any pin or step to recenter the map.</p>
          {audioCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF453A]/10 px-3 py-1 text-[11px] font-semibold text-[#B42318]">
              <Headphones className="h-3.5 w-3.5" />
              {audioCount} audio guide{audioCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.1fr)] gap-6">
        <div>
          <StepAccordion
            steps={steps}
            activeStepId={activeStepId}
            onSelectStep={setActiveStepId}
          />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ItineraryMap
            steps={steps}
            activeStepId={activeStepId}
            onSelectStep={setActiveStepId}
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { ItineraryMap } from "@/components/itinerary/itinerary-map";
import { StepAccordion } from "@/components/itinerary/step-accordion";
import type { ItineraryStep } from "@/types";

interface ItineraryExperienceProps {
  steps: ItineraryStep[];
  locked?: boolean;
}

/**
 * Two-column orchestrator: a sticky Mapbox panel on the right and the
 * color-coded accordion on the left. Selecting a step expands the body and
 * re-centers the map; clicking a marker on the map opens that accordion item.
 */
export function ItineraryExperience({ steps, locked }: ItineraryExperienceProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(
    steps[0]?.id ?? null,
  );

  if (steps.length === 0) {
    return (
      <p className="rounded-2xl bg-white border border-black/[0.06] p-6 text-sm text-foreground/60">
        Step-by-step content for this itinerary is being prepared.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.1fr)] gap-6">
      <div>
        <StepAccordion
          steps={steps}
          activeStepId={activeStepId}
          onSelectStep={setActiveStepId}
          locked={locked}
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
  );
}

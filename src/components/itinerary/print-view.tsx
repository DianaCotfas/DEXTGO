"use client";

import { useEffect } from "react";
import type { Itinerary, ItineraryStep } from "@/types";

export function PrintView({
  itinerary,
  steps,
}: {
  itinerary: Itinerary;
  steps: ItineraryStep[];
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-[#1d1d1f] print:p-0">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">
        DEXTGO
      </p>
      <h1 className="mt-2 text-3xl font-bold">{itinerary.title}</h1>
      {itinerary.excerpt ? (
        <p className="mt-3 text-base text-[#3a3a3c]">{itinerary.excerpt}</p>
      ) : null}
      <p className="mt-2 text-sm text-[#86868b]">
        {[itinerary.country, itinerary.region, itinerary.duration]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="mt-8 space-y-6">
        {steps.map((step, index) => (
          <section key={step.id ?? index} className="break-inside-avoid">
            <h2 className="text-lg font-semibold">
              {step.day ? `Day ${step.day}: ` : ""}
              {step.title}
            </h2>
            {step.body ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {step.body}
              </p>
            ) : null}
            {step.descriptionAndAudio ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#3a3a3c]">
                {step.descriptionAndAudio}
              </p>
            ) : null}
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-[#86868b] print:hidden">
        Use your browser menu: Print → Save as PDF
      </p>
    </div>
  );
}

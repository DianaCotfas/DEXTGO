"use client";

import { useMemo } from "react";
import { Headphones } from "lucide-react";
import { DayCard } from "@/components/itinerary/day-card";
import { PracticalInfo } from "@/components/itinerary/practical-info";
import type { Itinerary, ItineraryStep } from "@/types";

interface UnlockedItineraryProps {
  itinerary: Itinerary;
  steps: ItineraryStep[];
}

interface DayBucket {
  day: number;
  title?: string;
  intro?: string;
  steps: ItineraryStep[];
}

function groupByDay(steps: ItineraryStep[]): DayBucket[] {
  const buckets = new Map<number, DayBucket>();
  for (const step of steps) {
    const day = step.day ?? 1;
    const bucket = buckets.get(day);
    if (bucket) {
      bucket.steps.push(step);
      bucket.title = bucket.title ?? step.dayTitle;
      bucket.intro = bucket.intro ?? step.dayIntro;
    } else {
      buckets.set(day, {
        day,
        title: step.dayTitle,
        intro: step.dayIntro,
        steps: [step],
      });
    }
  }
  for (const bucket of buckets.values()) {
    bucket.steps.sort((a, b) => a.position - b.position);
  }
  return [...buckets.values()].sort((a, b) => a.day - b.day);
}

export function UnlockedItinerary({ itinerary, steps }: UnlockedItineraryProps) {
  const days = useMemo(() => groupByDay(steps), [steps]);
  const audioDays = useMemo(
    () =>
      days
        .map((day) => ({
          day: day.day,
          count: day.steps.filter((step) => !!step.audioUrl).length,
        }))
        .filter((day) => day.count > 0),
    [days],
  );
  const totalAudioGuides = useMemo(
    () => audioDays.reduce((sum, day) => sum + day.count, 0),
    [audioDays],
  );
  const extras = itinerary.extras;
  const hasExtras =
    !!extras &&
    ((extras.pharmacies?.length ?? 0) > 0 ||
      (extras.hospitals?.length ?? 0) > 0 ||
      (extras.emergencyNumbers?.length ?? 0) > 0);

  return (
    <div className="space-y-8">
      {itinerary.description && (
        <section className="rounded-3xl border border-black/[0.06] bg-gradient-to-br from-white to-[#FAFAFA] p-5 sm:p-7 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/50">
            Welcome to your itinerary
          </p>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-foreground/80 whitespace-pre-line">
            {itinerary.description}
          </p>
        </section>
      )}

      {days.length > 0 && (
        <nav
          aria-label="Day navigation"
          className="flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-white p-3"
        >
          {days.map((d) => (
            <a
              key={d.day}
              href={`#day-${d.day}`}
              className="rounded-full bg-foreground/[0.05] px-4 py-1.5 text-xs font-semibold text-foreground/75 hover:bg-foreground/[0.1]"
            >
              Day {d.day}
            </a>
          ))}
          {totalAudioGuides > 0 && (
            <a
              href="#audio-guides"
              className="rounded-full bg-[#FF453A]/10 px-4 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FF453A]/15"
            >
              Audio Guides
            </a>
          )}
          {hasExtras && (
            <a
              href="#practical-info"
              className="rounded-full bg-foreground/[0.05] px-4 py-1.5 text-xs font-semibold text-foreground/75 hover:bg-foreground/[0.1]"
            >
              Practical Info
            </a>
          )}
        </nav>
      )}

      <section
        id="audio-guides"
        className="rounded-3xl border border-[#FF453A]/20 bg-gradient-to-br from-[#fff7f6] to-white p-5 sm:p-7 shadow-sm scroll-mt-28"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#FF453A]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#B42318]">
              <Headphones className="h-3.5 w-3.5" />
              Audio Guides
            </p>
            <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-foreground">
              Listen while you explore
            </h2>
            <p className="mt-2 text-sm sm:text-base text-foreground/70">
              {totalAudioGuides > 0
                ? `${totalAudioGuides} audio guides are ready. Open any step marked "Audio guide" and press play.`
                : "Audio guides are being prepared for this itinerary. They will appear inside each step as soon as generation completes."}
            </p>
          </div>
        </div>
        {audioDays.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {audioDays.map((entry) => (
              <a
                key={entry.day}
                href={`#day-${entry.day}`}
                className="inline-flex items-center gap-2 rounded-full bg-white border border-[#FF453A]/25 px-3.5 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#fff7f6]"
              >
                Day {entry.day}
                <span className="rounded-full bg-[#FF453A]/10 px-2 py-0.5 text-[10px] font-bold">
                  {entry.count}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {days.map((d) => (
        <DayCard key={d.day} day={d.day} title={d.title} intro={d.intro} steps={d.steps} />
      ))}

      {days.length === 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
            Content pending
          </p>
          <p className="mt-2 text-sm text-amber-900">
            This itinerary is unlocked, but detailed day-by-day content has not been added yet.
            Please contact DEXTGO support to complete delivery.
          </p>
        </section>
      )}

      {hasExtras && extras && <PracticalInfo extras={extras} />}
    </div>
  );
}

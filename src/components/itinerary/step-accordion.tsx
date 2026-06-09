"use client";

import {
  ChevronDown,
  MapPin,
  Headphones,
  Lightbulb,
  Footprints,
  ExternalLink,
} from "lucide-react";
import { STEP_COLORS, type ItineraryStep, type ItineraryStepKind } from "@/types";
import { AudioPlayer } from "@/components/itinerary/audio-player";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { LucideIcon } from "lucide-react";

const ICONS: Record<ItineraryStepKind, LucideIcon> = {
  step: Footprints,
  pin: MapPin,
  audio: Headphones,
  tip: Lightbulb,
};

interface StepAccordionProps {
  steps: ItineraryStep[];
  activeStepId: string | null;
  onSelectStep: (stepId: string | null) => void;
  locked?: boolean;
}

export function StepAccordion({
  steps,
  activeStepId,
  onSelectStep,
  locked,
}: StepAccordionProps) {
  // Group steps by day preserving insertion order
  const dayOrder: number[] = [];
  const byDay: Record<number, ItineraryStep[]> = {};
  for (const step of steps) {
    const day = step.day ?? 1;
    if (!byDay[day]) { byDay[day] = []; dayOrder.push(day); }
    byDay[day].push(step);
  }
  // Sort each day's steps by position
  for (const day of dayOrder) {
    byDay[day].sort((a, b) => a.position - b.position);
  }
  const orderedDays = [...new Set(dayOrder)].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {orderedDays.map((day) => {
        const daySteps = byDay[day];
        // Numbering resets per day and per parent step.
        let stepCounter = 0;
        let placeCounterInStep = 0;
        let audioCounterInStep = 0;
        let tipCounterInStep = 0;
        const dayTitle = daySteps.find((s) => s.dayTitle)?.dayTitle;

        return (
          <div key={`day-${day}`}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/40">
                Day {day}{dayTitle ? ` — ${dayTitle}` : ""}
              </span>
              <div className="flex-1 h-px bg-black/[0.06]" />
            </div>
            <ul className="space-y-3">
              {daySteps.map((step) => {
        const open = activeStepId === step.id;
        const color = STEP_COLORS[step.kind];
        const Icon = ICONS[step.kind];
        let itemNumber = 1;
        if (step.kind === "step") {
          stepCounter += 1;
          placeCounterInStep = 0;
          audioCounterInStep = 0;
          tipCounterInStep = 0;
          itemNumber = stepCounter;
        } else if (step.kind === "pin") {
          placeCounterInStep += 1;
          itemNumber = placeCounterInStep;
        } else if (step.kind === "audio") {
          audioCounterInStep += 1;
          itemNumber = audioCounterInStep;
        } else {
          tipCounterInStep += 1;
          itemNumber = tipCounterInStep;
        }
        const stepIntro = step.body?.trim() ?? "";
        const stepDescription = step.descriptionAndAudio?.trim() ?? "";
        const stepDescriptionKids = step.descriptionAndAudioKids?.trim() ?? "";

        return (
          <li
            key={step.id}
            id={`step-${step.id}`}
            className={`rounded-2xl bg-white border border-black/[0.06] overflow-hidden transition-shadow ${
              open ? "shadow-md" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectStep(open ? null : step.id)}
              className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
              aria-expanded={open}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${color.bg} ${color.ring}`}
              >
                <Icon className="w-4 h-4" style={{ color: color.hex }} />
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: color.hex }}
                >
                  {color.label.toUpperCase()} {itemNumber}
                </p>
                <p className="mt-0.5 text-sm sm:text-base font-semibold text-foreground line-clamp-1">
                  {step.title}
                </p>
                {step.audioUrl && (
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FF453A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B42318]">
                    <Headphones className="h-3 w-3" />
                    Audio guide
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-foreground/40 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            {open && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-6">
                <div className="pl-14">
                  {locked && step.kind !== "tip" ? (
                    <p className="text-sm text-foreground/60 italic">
                      Full details unlock after purchase.
                    </p>
                  ) : (
                    <>
                      {step.audioUrl && (
                        <div className="mt-2 rounded-full border border-[#FF453A]/25 bg-[#fff7f6] p-1.5">
                          <AudioPlayer
                            src={step.audioUrl}
                            durationSeconds={step.audioDurationSeconds}
                            variant="slim"
                          />
                        </div>
                      )}
                      {stepIntro && (
                        <div className="mt-2 rounded-xl border border-black/[0.08] bg-black/[0.02]">
                          <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0A84FF]">
                            Step Intro
                          </div>
                          <div className="border-t border-black/[0.06] px-3 pb-3 pt-2">
                            <div className="prose prose-sm max-w-none text-foreground/75">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {stepIntro}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}

                      {(step.infoData || step.address || step.googleMapsUrl || step.officialUrl || (step.extraLinks && step.extraLinks.length > 0)) && (
                        <details className="mt-2 rounded-xl border border-black/[0.08] bg-black/[0.02]">
                          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">
                            Info Data
                          </summary>
                          <div className="border-t border-black/[0.06] px-3 pb-3 pt-2">
                            {step.infoData && (
                              <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line">
                                {step.infoData}
                              </p>
                            )}
                            {(step.address || step.googleMapsUrl || step.officialUrl || (step.extraLinks && step.extraLinks.length > 0)) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {step.address && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/75">
                                    <MapPin className="h-3 w-3" />
                                    {step.address}
                                  </span>
                                )}
                                {step.googleMapsUrl && (
                                  <a
                                    href={step.googleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    Google Maps
                                  </a>
                                )}
                                {step.officialUrl && (
                                  <a
                                    href={step.officialUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Official site
                                  </a>
                                )}
                                {step.extraLinks?.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {link.label || "Link"}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      {(stepDescription || stepDescriptionKids) && (
                        <details className="mt-2 rounded-xl border border-black/[0.08] bg-black/[0.02]">
                          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0A84FF]">
                            Description
                          </summary>
                          <div className="border-t border-black/[0.06] px-3 pb-3 pt-2 space-y-3">
                            {stepDescription && (
                              <div className="prose prose-sm max-w-none text-foreground/75">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {stepDescription}
                                </ReactMarkdown>
                              </div>
                            )}
                            {stepDescriptionKids && (
                              <>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/60">
                                  Audio and Description (For Kids)
                                </p>
                                <div className="prose prose-sm max-w-none text-foreground/75">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {stepDescriptionKids}
                                  </ReactMarkdown>
                                </div>
                              </>
                            )}
                          </div>
                        </details>
                      )}
                      {step.expertTips && (
                        <details className="mt-2 rounded-xl border border-black/[0.08] bg-black/[0.02]">
                          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">
                            Expert Tips
                          </summary>
                          <div className="border-t border-black/[0.06] px-3 pb-3 pt-2">
                            <div className="prose prose-sm max-w-none text-foreground/75">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {step.expertTips ?? ""}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </details>
                      )}
                      {step.images && step.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {step.images.map((src, index) => (
                            <div
                              key={`${step.id}-image-${index}`}
                              className="overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.02]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={`${step.title} image ${index + 1}`}
                                loading="lazy"
                                className="h-44 w-full object-cover sm:h-48"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
              );
            })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

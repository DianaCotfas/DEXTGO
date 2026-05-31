import { Compass, Map, Plane } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const steps = [
  {
    number: "01",
    icon: Compass,
    title: "Choose Your Vibe",
    description:
      "Browse our curated collection or request a tailor-made itinerary designed specifically for your needs.",
  },
  {
    number: "02",
    icon: Map,
    title: "Get Your Masterpiece",
    description:
      "Receive a complete, A-to-Z itinerary with GPS coordinates, audio guides, and insider tips.",
  },
  {
    number: "03",
    icon: Plane,
    title: "Explore with Confidence",
    description:
      "Travel stress-free knowing every detail has been verified for quality, safety, and accessibility.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding section-gap">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          eyebrow="3 Steps to Perfection"
          title="How It Works"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative group">
              <div className="relative p-8 sm:p-10 rounded-2xl bg-white card-shadow hover:card-shadow-hover transition-all duration-500 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1D1D1F]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

                <div className="relative mx-auto mb-6 w-16 h-16 rounded-full bg-[#1D1D1F] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <step.icon className="w-7 h-7 text-white" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#1D1D1F]">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>

              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 lg:-right-4 w-6 lg:w-8 h-[2px] bg-gradient-to-r from-[#1D1D1F]/60 to-[#1D1D1F]/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

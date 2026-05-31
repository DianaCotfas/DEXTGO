"use client";

import { Compass, Target, Heart } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { AnimatedCard } from "@/components/shared/animated-card";

const features = [
  {
    icon: Compass,
    title: "Expertly Curated",
    description:
      "Hand-picked and verified hotels, restaurants, and experiences — every recommendation tested by our team on the ground.",
  },
  {
    icon: Target,
    title: "Powered by Precision",
    description:
      "Millimetric precision for transfers and hidden gems. GPS coordinates, exact timings, and detailed directions for every stop.",
  },
  {
    icon: Heart,
    title: "Conscious & Inclusive",
    description:
      "Animal-friendly and fully accessible. We believe great travel should be available to everyone, with respect for local communities.",
  },
];

export function WhyDextgo() {
  return (
    <section className="section-padding section-gap bg-[#F5F5F7]">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          eyebrow="Why choose us"
          title="Why DEXTGO?"
        />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <AnimatedCard
              key={feature.title}
              delay={i * 0.12}
              className="p-8 sm:p-10 text-center"
            >
              <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}

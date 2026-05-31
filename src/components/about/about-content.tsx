import Image from "next/image";
import {
  Heart,
  Shield,
  Leaf,
  Eye,
  PawPrint,
  Accessibility,
  Wallet,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";

const values = [
  {
    icon: Eye,
    title: "Authenticity",
    description:
      "Every itinerary is born from real travel experiences. We walk the streets, taste the food, and sleep in the hotels before we ever recommend them to you.",
    color: "from-stone-50 to-neutral-100",
    iconBg: "bg-stone-200",
    iconColor: "text-stone-700",
  },
  {
    icon: Shield,
    title: "Quality & Precision",
    description:
      "Millimetric precision in every detail — from GPS coordinates to estimated walking times. We verify everything so you can travel with complete confidence.",
    color: "from-blue-50 to-indigo-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    icon: Heart,
    title: "Passion for Travel",
    description:
      "DEXTGO was born from a deep love of exploration. We believe travel should be transformative, not transactional.",
    color: "from-rose-50 to-pink-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
  },
  {
    icon: Wallet,
    title: "Budget Optimization",
    description:
      "We craft journeys that feel high-end without forcing you to pay high-end prices — every recommendation is weighed against real-world value so your money goes where it matters most.",
    color: "from-sky-50 to-cyan-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "We promote responsible tourism that respects local communities, preserves cultural heritage, and minimizes environmental impact.",
    color: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    icon: PawPrint,
    title: "Animal-Friendly",
    description:
      "We never recommend attractions that exploit animals. Every experience in our itineraries respects and protects wildlife.",
    color: "from-teal-50 to-cyan-50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    description:
      "Great travel should be available to everyone. We provide accessibility information for every recommendation so no one is left behind.",
    color: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
];

export function AboutContent() {
  return (
    <>
      <section className="section-padding section-gap">
        <div className="mx-auto max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                Our Story
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                A travel philosophy, not just a platform.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                DEXTGO was founded on the belief that every journey should be
                as unique as the traveler who takes it. We craft detailed,
                hand-tested itineraries that transform trips into
                unforgettable experiences.
              </p>
            </div>

            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-foreground">
                Hand-crafted. Personally verified.
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Unlike mass-produced travel guides, every DEXTGO itinerary is
                personally designed and verified. We travel the routes
                ourselves, testing hotels, restaurants, and hidden gems
                firsthand. The result is a level of detail and authenticity
                you simply won&apos;t find anywhere else — complete with GPS
                coordinates, professional audio guides, and expert insider
                tips.
              </p>
            </div>

            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-foreground">
                Rooted in Europe. Curious about the world.
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our work is the product of a small European team and a
                network of trusted collaborators on the ground — from guides
                and hoteliers to photographers and local experts. Together,
                we curate journeys that combine the precision of an
                architect with the warmth of a friend who knows exactly
                where to send you.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden card-shadow">
              <Image
                src="/images/about-us/foto1.png"
                alt="DEXTGO travel team moment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden card-shadow">
                <Image
                  src="/images/about-us/foto2.png"
                  alt="DEXTGO destination preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 20vw"
                />
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden card-shadow">
                <Image
                  src="/images/about-us/foto3.png"
                  alt="DEXTGO journey highlight"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 20vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding section-gap bg-[#F5F5F7]">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            title="Our Values"
            subtitle="What drives us — the principles guiding everything we create, from the destinations we choose to the experiences we recommend."
          />

          <div className="mt-14">
            <HorizontalSlider ariaLabel="Our values" gapPx={20}>
              {values.map((value) => (
                <div
                  key={value.title}
                  className={`snap-start shrink-0 w-[80%] sm:w-[48%] md:w-[36%] lg:w-[28%] p-8 rounded-2xl bg-gradient-to-br ${value.color} card-shadow hover:card-shadow-hover transition-shadow duration-500`}
                >
                  <div
                    className={`mb-5 w-12 h-12 rounded-2xl ${value.iconBg} flex items-center justify-center`}
                  >
                    <value.icon className={`w-5 h-5 ${value.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </HorizontalSlider>
          </div>
        </div>
      </section>

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            title="Our Mission"
            subtitle="To make expert-level travel planning accessible to everyone — combining precision, passion, and technology to create journeys that inspire."
          />
          <div className="mt-8">
            <p className="text-base text-muted-foreground leading-relaxed">
              Every itinerary we create is an invitation to see the world
              through new eyes — with the confidence that every detail has been
              thought through, every recommendation tested, and every moment
              designed to matter.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

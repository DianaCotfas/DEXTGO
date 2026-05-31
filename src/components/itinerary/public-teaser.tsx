import {
  Baby,
  ChefHat,
  Headphones,
  KeyRound,
  Lock,
  Map,
  MapPinned,
  ShieldPlus,
  Sparkles,
} from "lucide-react";
import type { Itinerary } from "@/types";
import { BuyButton } from "@/components/itinerary/buy-button";
import { formatPrice } from "@/lib/format";

interface PublicTeaserProps {
  itinerary: Itinerary;
}

/**
 * Locked, marketing-only view shown before purchase. Renders the sales preview
 * copy and the photo gallery from `previewImages`. Steps, daily plans, maps,
 * and practical info are intentionally hidden.
 */
export function PublicTeaser({ itinerary }: PublicTeaserProps) {
  const isRome = itinerary.slug === "rome-for-kids";
  const teaser = itinerary.extras?.publicTeaser;
  const subtitle =
    teaser?.subtitle?.trim() ||
    (isRome
      ? "Rome for Kids: The 5-Day Magical Itinerary"
      : itinerary.excerpt);
  const salesCopy =
    itinerary.salesPreview ??
    (isRome
      ? "Forget the usual dusty guidebooks. Transform Rome into the world's most beautiful playground with an adventure designed to entertain children and let parents relax. We have created a unique path that combines the majesty of monuments with moments of pure curiosity and relaxation."
      : itinerary.excerpt);
  const defaultFeatures = isRome
    ? [
        {
          icon: Sparkles,
          title: "5 Days of Magic",
          body: "From the Colosseum to Trastevere, all the way to the EUR lake.",
        },
        {
          icon: Baby,
          title: "Unforgettable Experiences",
          body: "Become a gladiator for a day, discover the \"keyhole\" secret, and learn to cook like a true Roman.",
        },
        {
          icon: MapPinned,
          title: "\"Zero Stress\" Logistics",
          body: "Detailed maps, GPS coordinates, elevators for strollers, and tricks to skip the line.",
        },
        {
          icon: ChefHat,
          title: "Expert Advice",
          body: "Only the best family-friendly restaurants with quality ingredients and fast service.",
        },
        {
          icon: KeyRound,
          title: "Secrets and Legends",
          body: "Fascinating stories to keep the little ones hooked on the beauty surrounding them.",
        },
      ]
    : [
        {
          icon: Sparkles,
          title: "Curated route",
          body: "A professionally sequenced route built around must-see icons and meaningful local details.",
        },
        {
          icon: MapPinned,
          title: "Zero-stress logistics",
          body: "Built around exact addresses, smart sequencing, and clear movement between stops.",
        },
        {
          icon: KeyRound,
          title: "Hidden details",
          body: "Local tips, story-rich stops, and the moments that make the route feel personal.",
        },
      ];
  const customLeftFeatures = (teaser?.leftFeatures ?? []).filter(
    (item) => item.title?.trim() && item.body?.trim(),
  );
  const leftFeatureIcons = [Sparkles, Baby, MapPinned, ChefHat, KeyRound];
  const features =
    customLeftFeatures.length > 0
      ? customLeftFeatures.map((feature, idx) => ({
          icon: leftFeatureIcons[idx % leftFeatureIcons.length],
          title: feature.title,
          body: feature.body,
        }))
      : defaultFeatures;

  const defaultLockedFeatures = [
    {
      icon: Map,
      title: "Full day-by-day plan",
      body: "Exact addresses and Google Maps links.",
    },
    {
      icon: Headphones,
      title: "Audio Guides",
      body: "Professional Audio Guides for every major site.",
    },
    {
      icon: MapPinned,
      title: "Interactive Maps",
      body: "Per-Day Maps with all pinned stops.",
    },
    {
      icon: ShieldPlus,
      title: "Practical Info",
      body: "Pharmacies, hospitals, and emergency numbers.",
    },
  ];
  const customLockedFeatures = (teaser?.lockedFeatures ?? []).filter(
    (item) => item.title?.trim() && item.body?.trim(),
  );
  const lockedFeatureIcons = [Map, Headphones, MapPinned, ShieldPlus];
  const lockedFeatures =
    customLockedFeatures.length > 0
      ? customLockedFeatures.map((feature, idx) => ({
          icon: lockedFeatureIcons[idx % lockedFeatureIcons.length],
          title: feature.title,
          body: feature.body,
        }))
      : defaultLockedFeatures;
  const lockedTitle =
    teaser?.lockedTitle?.trim() || "The interactive experience is locked.";
  const lockedIntro =
    teaser?.lockedIntro?.trim() || "After purchase, you'll unlock:";

  return (
    <div className="space-y-12">
      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {itinerary.title}
            </h2>
            <p className="mt-2 text-xl sm:text-2xl font-normal text-foreground/75">
              {subtitle}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-foreground/75">
              {salesCopy}
            </p>

            <ul className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex gap-4">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-foreground/65">
                        {feature.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <aside className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold leading-tight text-foreground">
                  {lockedTitle}
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  {lockedIntro}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-4">
              {lockedFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F7] text-foreground/75">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {feature.title}
                      </p>
                      <p className="text-xs leading-5 text-foreground/60">
                        {feature.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-black/[0.06] pt-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/45">
                One-time price
              </p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(itinerary.price * 100)}
                </p>
                <BuyButton itinerarySlug={itinerary.slug} title={itinerary.title} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

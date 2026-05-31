"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { featuredItineraries } from "@/data/itineraries";
import { getSavedTripSlugsClient } from "@/components/itinerary/save-trip-button";

type TripCard = (typeof featuredItineraries)[number];

export function SavedTripsClient() {
  const [savedTrips, setSavedTrips] = useState<TripCard[]>([]);

  useEffect(() => {
    const sync = () => {
      const slugs = getSavedTripSlugsClient();
      setSavedTrips(featuredItineraries.filter((trip) => slugs.includes(trip.slug)));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("saved-trips-updated", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("saved-trips-updated", sync as EventListener);
    };
  }, []);

  if (savedTrips.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-black/[0.06] p-8 text-center">
        <p className="text-sm text-foreground/60">
          Saved trips will appear here as you bookmark them.
        </p>
        <Link
          href="/itineraries"
          className="mt-4 inline-flex items-center rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
        >
          Browse itineraries
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {savedTrips.map((trip) => (
        <Link
          key={trip.slug}
          href={`/itineraries/${trip.slug}`}
          className="group rounded-2xl bg-white border border-black/[0.06] overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={trip.image}
              alt={trip.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-foreground">{trip.title}</p>
            <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{trip.excerpt}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

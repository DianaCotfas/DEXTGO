"use client";

import { useMemo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cross, Hospital, Phone, MapPin, ExternalLink, Clock } from "lucide-react";
import { env, isConfigured } from "@/lib/env";
import type { ItineraryExtras, PointOfInterest } from "@/types";
import { ListChecks } from "lucide-react";

interface PracticalInfoProps {
  extras: ItineraryExtras;
}

interface MarkerPoint extends PointOfInterest {
  category: "pharmacy" | "hospital";
}

const CATEGORY_STYLE: Record<MarkerPoint["category"], { hex: string; label: string }> = {
  pharmacy: { hex: "#16a34a", label: "Pharmacy" },
  hospital: { hex: "#dc2626", label: "Hospital" },
};

export function PracticalInfo({ extras }: PracticalInfoProps) {
  const pharmacies = useMemo(() => extras.pharmacies ?? [], [extras.pharmacies]);
  const hospitals = useMemo(() => extras.hospitals ?? [], [extras.hospitals]);
  const emergencyNumbers = extras.emergencyNumbers ?? [];
  const customSections = extras.customSections ?? [];

  const markers = useMemo<MarkerPoint[]>(
    () => [
      ...pharmacies
        .filter((p): p is PointOfInterest & { coords: NonNullable<PointOfInterest["coords"]> } => !!p.coords)
        .map((p) => ({ ...p, category: "pharmacy" as const })),
      ...hospitals
        .filter((p): p is PointOfInterest & { coords: NonNullable<PointOfInterest["coords"]> } => !!p.coords)
        .map((p) => ({ ...p, category: "hospital" as const })),
    ],
    [pharmacies, hospitals],
  );

  const initial = markers[0]?.coords ?? { lat: 41.9028, lng: 12.4964 };

  if (
    pharmacies.length === 0 &&
    hospitals.length === 0 &&
    emergencyNumbers.length === 0 &&
    customSections.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="practical-info"
      className="rounded-3xl border border-black/[0.06] bg-white p-5 sm:p-7 shadow-sm scroll-mt-28"
    >
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/50">
          Practical Info
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-foreground">
          Pharmacies, hospitals, and emergency numbers
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          Save these before you go — a small map of vetted health stops, plus the
          numbers worth knowing if anything happens.
        </p>
      </header>

      {markers.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-black/[0.06] h-[340px]">
          {isConfigured("mapbox") ? (
            <Map
              mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/light-v11"
              initialViewState={{
                longitude: initial.lng,
                latitude: initial.lat,
                zoom: 12,
              }}
              style={{ width: "100%", height: "100%" }}
            >
              {markers.map((point) => {
                const style = CATEGORY_STYLE[point.category];
                return (
                  <Marker
                    key={`${point.category}-${point.name}`}
                    longitude={point.coords!.lng}
                    latitude={point.coords!.lat}
                    anchor="bottom"
                  >
                    <div
                      className="grid h-8 w-8 place-items-center rounded-full border-2 border-white text-white shadow-md"
                      style={{ backgroundColor: style.hex }}
                      title={`${style.label}: ${point.name}`}
                    >
                      {point.category === "pharmacy" ? (
                        <Cross className="h-4 w-4" />
                      ) : (
                        <Hospital className="h-4 w-4" />
                      )}
                    </div>
                  </Marker>
                );
              })}
            </Map>
          ) : (
            <div className="flex h-full items-center justify-center bg-[#F5F5F7] p-8 text-center">
              <p className="text-xs text-foreground/60 max-w-xs">
                Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to render the
                pharmacies + hospitals mini-map. The lists below remain fully
                usable.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {pharmacies.length > 0 && (
          <PoiList
            title="Pharmacies"
            color={CATEGORY_STYLE.pharmacy.hex}
            icon={<Cross className="h-4 w-4" />}
            points={pharmacies}
          />
        )}
        {hospitals.length > 0 && (
          <PoiList
            title="Hospitals"
            color={CATEGORY_STYLE.hospital.hex}
            icon={<Hospital className="h-4 w-4" />}
            points={hospitals}
          />
        )}
      </div>

      {emergencyNumbers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[#F5F5F7] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">
            Emergency numbers
          </h3>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyNumbers.map((entry) => (
              <li
                key={`${entry.label}-${entry.number}`}
                className="flex items-start gap-3 rounded-xl bg-white p-3 border border-black/[0.05]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
                  <Phone className="h-4 w-4 text-foreground/70" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-foreground/55">
                    {entry.label}
                  </p>
                  <a
                    href={`tel:${entry.number.replace(/\s+/g, "")}`}
                    className="text-base font-semibold text-foreground"
                  >
                    {entry.number}
                  </a>
                  {entry.description && (
                    <p className="mt-0.5 text-xs text-foreground/55">
                      {entry.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {customSections.map((section, idx) => (
        <div
          key={`custom-${idx}-${section.title}`}
          className="mt-6 rounded-2xl border border-black/[0.06] bg-[#F5F5F7] p-5"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">
            <ListChecks className="h-4 w-4 shrink-0" />
            {section.title}
          </h3>
          {(section.items ?? []).length > 0 && (
            <PoiList
              title={section.title}
              color="#6b7280"
              icon={<ListChecks className="h-4 w-4" />}
              points={section.items ?? []}
              hideHeader
            />
          )}
        </div>
      ))}
    </section>
  );
}

function PoiList({
  title,
  color,
  icon,
  points,
  hideHeader,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
  points: PointOfInterest[];
  hideHeader?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-5">
      {!hideHeader && (
        <header className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/70">
            {title}
          </h3>
        </header>
      )}
      <ul className={`${hideHeader ? "" : "mt-4"} space-y-3`}>
        {points.map((p) => {
          const mapsHref = p.coords
            ? `https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}`
            : p.address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
              : undefined;
          return (
            <li
              key={p.name}
              className="rounded-xl border border-black/[0.05] bg-white p-3"
            >
              <p className="font-semibold text-foreground">{p.name}</p>
              {p.address && (
                <p className="mt-1 flex items-start gap-2 text-xs text-foreground/65">
                  <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" />
                  <span>{p.address}</span>
                </p>
              )}
              {p.hours && (
                <p className="mt-1 flex items-center gap-2 text-xs text-foreground/65">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{p.hours}</span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {p.phone && (
                  <a
                    href={`tel:${p.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                  >
                    <Phone className="h-3 w-3" />
                    {p.phone}
                  </a>
                )}
                {mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                  >
                    <MapPin className="h-3 w-3" />
                    Maps
                  </a>
                )}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

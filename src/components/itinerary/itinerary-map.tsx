"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { env, isConfigured } from "@/lib/env";
import { STEP_COLORS, type ItineraryStep } from "@/types";

interface ItineraryMapProps {
  steps: ItineraryStep[];
  activeStepId: string | null;
  onSelectStep: (stepId: string | null) => void;
}

// Accent color per day (cycles when there are more than 8 days)
const DAY_COLORS = [
  "#0A84FF",
  "#30D158",
  "#FF9F0A",
  "#FF453A",
  "#BF5AF2",
  "#5E5CE6",
  "#64D2FF",
  "#FFD60A",
];

export function ItineraryMap({
  steps,
  activeStepId,
  onSelectStep,
}: ItineraryMapProps) {
  const mapRef = useRef<MapRef>(null);

  const pinned = useMemo(
    () =>
      steps.filter(
        (s): s is ItineraryStep & { coords: NonNullable<ItineraryStep["coords"]> } =>
          !!s.coords,
      ),
    [steps],
  );

  const initial = pinned[0]?.coords ?? { lat: 41.8902, lng: 12.4922 };

  // Build one GeoJSON LineString per day for the route polylines
  const routeLayers = useMemo(() => {
    type PinnedStep = ItineraryStep & { coords: NonNullable<ItineraryStep["coords"]> };
    const byDay: Record<number, PinnedStep[]> = {};
    for (const step of pinned) {
      const day = step.day ?? 1;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(step);
    }

    const layers: { day: number; color: string; coordinates: [number, number][] }[] = [];
    for (const [dayKey, daySteps] of Object.entries(byDay)) {
      const day = Number(dayKey);
      const sorted = [...daySteps].sort((a, b) => a.position - b.position);
      if (sorted.length < 2) continue;
      layers.push({
        day,
        color: DAY_COLORS[(day - 1) % DAY_COLORS.length],
        coordinates: sorted.map((s) => [s.coords.lng, s.coords.lat]),
      });
    }

    return layers;
  }, [pinned]);

  useEffect(() => {
    if (!activeStepId) return;
    const step = steps.find((s) => s.id === activeStepId);
    if (!step?.coords) return;
    flyToStep(mapRef.current, step);
  }, [activeStepId, steps]);

  if (!isConfigured("mapbox")) {
    return (
      <div className="aspect-square sm:aspect-auto sm:h-[520px] rounded-2xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center text-center p-8">
        <div>
          <p className="text-sm font-semibold">Interactive map</p>
          <p className="mt-2 text-xs text-foreground/60 max-w-xs">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to enable the live Mapbox map. The
            color-coded steps below stay fully usable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.06] h-[520px]">
      <Map
        ref={mapRef}
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        initialViewState={{
          longitude: initial.lng,
          latitude: initial.lat,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Route polylines per day */}
        {routeLayers.map(({ day, color, coordinates }) => (
          <Source
            key={`route-day-${day}`}
            id={`route-day-${day}`}
            type="geojson"
            data={{
              type: "Feature",
              geometry: { type: "LineString", coordinates },
              properties: {},
            }}
          >
            <Layer
              id={`route-line-day-${day}`}
              type="line"
              paint={{
                "line-color": color,
                "line-width": 2.5,
                "line-dasharray": [2, 1.5],
                "line-opacity": 0.65,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        ))}

        {/* Step markers */}
        {pinned.map((step, index) => {
          const color = STEP_COLORS[step.kind];
          const isActive = step.id === activeStepId;
          return (
            <Marker
              key={step.id}
              longitude={step.coords.lng}
              latitude={step.coords.lat}
              anchor="bottom"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectStep(step.id);
                  requestAnimationFrame(() => {
                    document
                      .getElementById(`step-${step.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  });
                }}
                className={`group relative grid place-items-center transition-transform duration-200 ${
                  isActive ? "scale-110" : "hover:scale-105"
                }`}
                style={{ color: color.hex }}
                aria-label={step.title}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-md transition-shadow ${
                    isActive ? "shadow-lg ring-4 ring-white" : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {index + 1}
                </span>
                <span
                  className="absolute top-full mt-1 whitespace-nowrap rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-foreground/80 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  style={{ pointerEvents: "none" }}
                >
                  {step.title}
                </span>
              </button>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

export function flyToStep(map: MapRef | null, step: ItineraryStep) {
  if (!map || !step.coords) return;
  map.flyTo({
    center: [step.coords.lng, step.coords.lat],
    zoom: 14,
    duration: 1200,
    essential: true,
  });
}

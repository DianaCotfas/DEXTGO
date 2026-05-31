"use client";

import { Trash2, PlusCircle } from "lucide-react";
import type { ItineraryExtras, PointOfInterest, EmergencyNumber, CustomExtrasSection } from "@/types";

interface ExtrasEditorProps {
  value: ItineraryExtras;
  onChange: (next: ItineraryExtras) => void;
}

const emptyPoi = (): PointOfInterest => ({
  name: "",
  address: "",
  phone: "",
  hours: "",
  url: "",
});

const emptyNumber = (): EmergencyNumber => ({
  label: "",
  number: "",
  description: "",
});

const emptySection = (): CustomExtrasSection => ({
  title: "",
  items: [],
});

export function ExtrasEditor({ value, onChange }: ExtrasEditorProps) {
  const pharmacies = value.pharmacies ?? [];
  const hospitals = value.hospitals ?? [];
  const emergencyNumbers = value.emergencyNumbers ?? [];
  const customSections = value.customSections ?? [];

  function patchPoiList(
    key: "pharmacies" | "hospitals",
    next: PointOfInterest[],
  ) {
    onChange({ ...value, [key]: next });
  }

  function patchNumbers(next: EmergencyNumber[]) {
    onChange({ ...value, emergencyNumbers: next });
  }

  function patchCustomSections(next: CustomExtrasSection[]) {
    onChange({ ...value, customSections: next });
  }

  return (
    <div className="space-y-6">
      <PoiListEditor
        title="Pharmacies"
        items={pharmacies}
        onChange={(next) => patchPoiList("pharmacies", next)}
      />
      <PoiListEditor
        title="Hospitals"
        items={hospitals}
        onChange={(next) => patchPoiList("hospitals", next)}
      />

      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/65">
            Emergency numbers
          </h3>
          <button
            type="button"
            onClick={() => patchNumbers([...emergencyNumbers, emptyNumber()])}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-semibold hover:bg-foreground/[0.1]"
          >
            <PlusCircle className="h-3 w-3" /> Add
          </button>
        </header>
        <ul className="mt-3 space-y-3">
          {emergencyNumbers.map((entry, idx) => (
            <li
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.5fr_auto] items-center gap-2"
            >
              <input
                placeholder="Label (e.g. Police)"
                value={entry.label}
                onChange={(e) =>
                  patchNumbers(
                    emergencyNumbers.map((n, i) =>
                      i === idx ? { ...n, label: e.target.value } : n,
                    ),
                  )
                }
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <input
                placeholder="Number"
                value={entry.number}
                onChange={(e) =>
                  patchNumbers(
                    emergencyNumbers.map((n, i) =>
                      i === idx ? { ...n, number: e.target.value } : n,
                    ),
                  )
                }
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <input
                placeholder="Description (optional)"
                value={entry.description ?? ""}
                onChange={(e) =>
                  patchNumbers(
                    emergencyNumbers.map((n, i) =>
                      i === idx ? { ...n, description: e.target.value } : n,
                    ),
                  )
                }
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  patchNumbers(emergencyNumbers.filter((_, i) => i !== idx))
                }
                className="text-foreground/50 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {emergencyNumbers.length === 0 && (
            <li className="text-xs text-foreground/55">No numbers yet.</li>
          )}
        </ul>
      </div>

      {/* Custom / free-form sections */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <header className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/65">
              Custom sections
            </h3>
            <p className="text-[11px] text-foreground/50 mt-0.5">
              Add any practical category, e.g. Supermarkets, Clothing / Packing tips, Travel Documents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => patchCustomSections([...customSections, emptySection()])}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-semibold hover:bg-foreground/[0.1] shrink-0"
          >
            <PlusCircle className="h-3 w-3" /> Add section
          </button>
        </header>
        <div className="space-y-4">
          {customSections.map((section, sIdx) => (
            <div key={sIdx} className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Section title (e.g. Supermarkets)"
                  value={section.title}
                  onChange={(e) =>
                    patchCustomSections(
                      customSections.map((s, i) =>
                        i === sIdx ? { ...s, title: e.target.value } : s,
                      ),
                    )
                  }
                  className="flex-1 rounded-xl border border-black/[0.08] px-3 py-1.5 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchCustomSections(customSections.filter((_, i) => i !== sIdx))
                  }
                  className="text-foreground/40 hover:text-red-600"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <PoiListEditor
                title={`Items in "${section.title || "this section"}"`}
                items={section.items ?? []}
                compact
                onChange={(next) =>
                  patchCustomSections(
                    customSections.map((s, i) =>
                      i === sIdx ? { ...s, items: next } : s,
                    ),
                  )
                }
              />
            </div>
          ))}
          {customSections.length === 0 && (
            <p className="text-xs text-foreground/55">No custom sections yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PoiListEditor({
  title,
  items,
  onChange,
  compact,
}: {
  title: string;
  items: PointOfInterest[];
  onChange: (next: PointOfInterest[]) => void;
  compact?: boolean;
}) {
  function patch(idx: number, patch: Partial<PointOfInterest>) {
    onChange(items.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  return (
    <div className={compact ? "space-y-2" : "rounded-2xl border border-black/[0.06] bg-white p-4"}>
      <header className="flex items-center justify-between gap-2">
        {!compact && (
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/65">
            {title}
          </h3>
        )}
        <button
          type="button"
          onClick={() => onChange([...items, emptyPoi()])}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-semibold hover:bg-foreground/[0.1]"
        >
          <PlusCircle className="h-3 w-3" /> Add {compact ? "item" : ""}
        </button>
      </header>
      <ul className={compact ? "space-y-2" : "mt-3 space-y-4"}>
        {items.map((p, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-black/[0.05] bg-[#FAFAFA] p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                placeholder="Name"
                value={p.name}
                onChange={(e) => patch(idx, { name: e.target.value })}
                className="flex-1 rounded-xl border border-black/[0.08] px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="text-foreground/50 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              placeholder="Address"
              value={p.address ?? ""}
              onChange={(e) => patch(idx, { address: e.target.value })}
              className="w-full rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
            />
            <div className="grid sm:grid-cols-3 gap-2">
              <input
                placeholder="Phone"
                value={p.phone ?? ""}
                onChange={(e) => patch(idx, { phone: e.target.value })}
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <input
                placeholder="Hours"
                value={p.hours ?? ""}
                onChange={(e) => patch(idx, { hours: e.target.value })}
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <input
                placeholder="Website (optional)"
                value={p.url ?? ""}
                onChange={(e) => patch(idx, { url: e.target.value })}
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                placeholder="Latitude"
                type="number"
                step="0.000001"
                value={p.coords?.lat ?? ""}
                onChange={(e) =>
                  patch(idx, {
                    coords: {
                      lat: e.target.value === "" ? 0 : Number(e.target.value),
                      lng: p.coords?.lng ?? 0,
                    },
                  })
                }
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
              <input
                placeholder="Longitude"
                type="number"
                step="0.000001"
                value={p.coords?.lng ?? ""}
                onChange={(e) =>
                  patch(idx, {
                    coords: {
                      lat: p.coords?.lat ?? 0,
                      lng: e.target.value === "" ? 0 : Number(e.target.value),
                    },
                  })
                }
                className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
              />
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-foreground/55">No entries yet.</li>
        )}
      </ul>
    </div>
  );
}

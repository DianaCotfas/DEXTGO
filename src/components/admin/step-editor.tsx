"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2, PlusCircle, Sparkles, Link2, X } from "lucide-react";
import { saveStep, deleteStep } from "@/app/(admin)/admin/itineraries/actions";
import { STEP_COLORS, type ItineraryStepKind } from "@/types";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";

type StepRow = {
  id: string;
  itinerary_id: string;
  position: number;
  kind: ItineraryStepKind;
  title: string;
  body: string | null;
  lat: number | null;
  lng: number | null;
  audio_url: string | null;
  day: number | null;
  day_title: string | null;
  official_url: string | null;
  google_maps_url: string | null;
  address: string | null;
  day_intro: string | null;
  info_data: string | null;
  description_long: string | null;
  description_kids: string | null;
  expert_tips: string | null;
  image_urls: string[] | null;
  extra_links?: { label: string; url: string }[] | null;
  updated_at?: string;
};

interface StepEditorProps {
  itineraryId: string;
  initialSteps: StepRow[];
  audioReady?: boolean;
  audioReason?: string;
}

export function StepEditor({
  itineraryId,
  initialSteps,
  audioReady = false,
  audioReason,
}: StepEditorProps) {
  const [steps, setSteps] = useState(initialSteps);
  const [pending, start] = useTransition();
  const stubCounterRef = useRef(0);

  function normalizePositions(rows: StepRow[]): StepRow[] {
    const dayCounters = new Map<number, number>();
    return rows.map((row) => {
      const day = row.day ?? 1;
      const nextPosition = (dayCounters.get(day) ?? 0) + 1;
      dayCounters.set(day, nextPosition);
      return { ...row, position: nextPosition };
    });
  }

  const groupedByDay = steps.reduce<Record<number, StepRow[]>>((acc, step) => {
    const day = step.day ?? 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(step);
    return acc;
  }, {});
  const orderedDays = Object.keys(groupedByDay)
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  function makeStub(day: number, rows: StepRow[]): StepRow {
    const maxPositionForDay = rows
      .filter((step) => (step.day ?? 1) === day)
      .reduce((max, step) => Math.max(max, step.position), 0);
    stubCounterRef.current += 1;
    return {
      id: `tmp-${itineraryId}-${stubCounterRef.current}`,
      itinerary_id: itineraryId,
      position: maxPositionForDay + 1,
      kind: "step",
      title: "",
      body: "",
      lat: null,
      lng: null,
      audio_url: null,
      day,
      day_title: null,
      official_url: null,
      google_maps_url: null,
      address: null,
      day_intro: null,
      info_data: null,
      description_long: null,
      description_kids: null,
      expert_tips: null,
      image_urls: [],
      extra_links: [],
    };
  }

  function addStubToDay(day: number) {
    setSteps((prev) => normalizePositions([...prev, makeStub(day, prev)]));
  }

  function addNewDay() {
    setSteps((prev) => {
      const latestDay = prev.reduce((max, step) => Math.max(max, step.day ?? 1), 0);
      return normalizePositions([...prev, makeStub(latestDay + 1, prev)]);
    });
  }

  function addPlaceAfterStep(parentStep: StepRow) {
    // Find index of parent in original `steps` array, then insert after the last child of that step
    setSteps((prev) => {
      const next: StepRow = {
        ...makeStub(parentStep.day ?? 1, prev),
        kind: "pin",
      };
      const parentIdx = prev.findIndex((s) => s.id === parentStep.id);
      if (parentIdx === -1) return normalizePositions([...prev, next]);
      // Walk forward to find where the next "step" starts (or end of array)
      let insertAt = parentIdx + 1;
      while (insertAt < prev.length && prev[insertAt].kind !== "step" && (prev[insertAt].day ?? 1) === (parentStep.day ?? 1)) {
        insertAt++;
      }
      return normalizePositions([...prev.slice(0, insertAt), next, ...prev.slice(insertAt)]);
    });
  }

  return (
    <div className="space-y-4">
      {/* Quick help banner so Diana understands the model */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900">
        <strong>How this works:</strong> Each <strong>Day</strong> contains <strong>Steps</strong> (blue, main checkpoints).
        Each Step can have nested <strong>Places</strong> (green), <strong>Audio</strong> (red), and <strong>Tips</strong> (yellow) below it.
        Use the buttons under each Step to add children. Use &quot;Add new Step&quot; for a new checkpoint, &quot;Add new Day&quot; for the next day.
        Numbering is automatic: <strong>Step 1, 2, 3…</strong> resets per day, and <strong>Place 1, 2, 3…</strong> (and Audio/Tip) resets inside each Step.
        The small number box next to each row is the <strong>Day</strong> field (which day this item belongs to), not the Step/Place number.
      </div>

      {orderedDays.map((day) => {
        const daySteps = groupedByDay[day].slice().sort((a, b) => a.position - b.position);
        const dayTitle = daySteps.find((step) => !!step.day_title)?.day_title;

        // Group: each "step" kind row starts a new bucket; subsequent non-step rows become its children
        type Bucket = { parent: StepRow | null; children: StepRow[] };
        const buckets: Bucket[] = [];
        let currentBucket: Bucket | null = null;
        for (const row of daySteps) {
          if (row.kind === "step") {
            currentBucket = { parent: row, children: [] };
            buckets.push(currentBucket);
          } else {
            if (!currentBucket) {
              // Orphan: place/tip/audio with no parent step → put in standalone bucket
              currentBucket = { parent: null, children: [] };
              buckets.push(currentBucket);
            }
            currentBucket.children.push(row);
          }
        }

        // Logical display numbers: Step N resets per day; Place/Audio/Tip N
        // reset inside each parent Step. This matches the public site and PDF
        // and avoids the "Step 1 -> Step 5" jump caused by raw positions.
        const displayNumbers = new Map<string, number>();
        {
          let stepCounter = 0;
          let placeCounterInStep = 0;
          let audioCounterInStep = 0;
          let tipCounterInStep = 0;
          for (const row of daySteps) {
            if (row.kind === "step") {
              stepCounter += 1;
              placeCounterInStep = 0;
              audioCounterInStep = 0;
              tipCounterInStep = 0;
              displayNumbers.set(row.id, stepCounter);
            } else if (row.kind === "pin") {
              placeCounterInStep += 1;
              displayNumbers.set(row.id, placeCounterInStep);
            } else if (row.kind === "audio") {
              audioCounterInStep += 1;
              displayNumbers.set(row.id, audioCounterInStep);
            } else {
              tipCounterInStep += 1;
              displayNumbers.set(row.id, tipCounterInStep);
            }
          }
        }

        const renderRow = (s: StepRow) => (
          <StepRowForm
            key={s.id}
            step={s}
            itineraryId={itineraryId}
            displayNumber={displayNumbers.get(s.id) ?? 1}
            audioReady={audioReady}
            audioReason={audioReason}
            onPatched={(patch) =>
              setSteps((prev) =>
                prev.map((p) => (p.id === s.id ? { ...p, ...patch } : p)),
              )
            }
            onSavedId={(newId) =>
              setSteps((prev) =>
                prev.map((p) => (p.id === s.id ? { ...p, id: newId } : p)),
              )
            }
            onAudioGenerated={(audioUrl) =>
              setSteps((prev) =>
                prev.map((p) => (p.id === s.id ? { ...p, audio_url: audioUrl } : p)),
              )
            }
            onDeleted={() => setSteps((prev) => prev.filter((p) => p.id !== s.id))}
            pending={pending}
            start={start}
          />
        );

        return (
          <section
            key={`day-${day}`}
            className="rounded-2xl border border-black/[0.07] bg-[#fafafa] p-3 sm:p-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/55">
                  Public day section
                </p>
                <h3 className="text-sm font-semibold text-foreground">
                  Day {day}{dayTitle ? ` - ${dayTitle}` : ""}
                </h3>
              </div>
            </div>

            {buckets.map((bucket, bi) => (
              <div
                key={bucket.parent?.id ?? `orphan-${bi}`}
                className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-2"
              >
                {bucket.parent && renderRow(bucket.parent)}
                {bucket.children.length > 0 && (
                  <div className="ml-4 pl-3 border-l-2 border-green-200 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700">
                      Nested items in this step
                    </p>
                    {bucket.children.map((c) => renderRow(c))}
                  </div>
                )}
                {bucket.parent && (
                  <button
                    type="button"
                    onClick={() => addPlaceAfterStep(bucket.parent!)}
                    className="ml-4 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1.5 hover:bg-green-100"
                  >
                    <PlusCircle className="w-3 h-3" /> Add Place inside this Step
                  </button>
                )}
              </div>
            ))}

            {/* Add a brand-new STEP inside this day */}
            <button
              type="button"
              onClick={() => addStubToDay(day)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold px-3 py-1.5 hover:bg-blue-100"
            >
              <PlusCircle className="w-3 h-3" /> Add new Step in Day {day}
            </button>
          </section>
        );
      })}
      {/* Add a brand-new day */}
      <button
        type="button"
        onClick={addNewDay}
        className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-2"
      >
        <PlusCircle className="w-3.5 h-3.5" /> Add new Day
      </button>
    </div>
  );
}

function StepRowForm({
  step,
  itineraryId,
  displayNumber,
  audioReady,
  audioReason,
  onPatched,
  onSavedId,
  onAudioGenerated,
  onDeleted,
  pending,
  start,
}: {
  step: StepRow;
  itineraryId: string;
  displayNumber: number;
  audioReady: boolean;
  audioReason?: string;
  onPatched: (patch: Partial<StepRow>) => void;
  onSavedId: (id: string) => void;
  onAudioGenerated: (audioUrl: string) => void;
  onDeleted: () => void;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const isNew = step.id.startsWith("tmp-");
  const color = STEP_COLORS[step.kind];

  // Fully controlled state — prevents React 19 form-reset from clearing fields
  const [position, setPosition] = useState(step.position);
  const [day, setDay] = useState(step.day ?? 1);
  const [kind, setKind] = useState<ItineraryStepKind>(step.kind);
  const [title, setTitle] = useState(step.title);
  const [dayTitle, setDayTitle] = useState(step.day_title ?? "");
  const [dayIntro, setDayIntro] = useState(step.day_intro ?? "");
  const [body, setBody] = useState(step.body ?? "");
  const [address, setAddress] = useState(step.address ?? "");
  const [infoData, setInfoData] = useState(step.info_data ?? "");
  const [descLong, setDescLong] = useState(step.description_long ?? "");
  const [descKids, setDescKids] = useState(step.description_kids ?? "");
  const [expertTips, setExpertTips] = useState(step.expert_tips ?? "");
  const [officialUrl, setOfficialUrl] = useState(step.official_url ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(step.google_maps_url ?? "");
  const [lat, setLat] = useState(step.lat?.toString() ?? "");
  const [lng, setLng] = useState(step.lng?.toString() ?? "");
  const [audioUrl, setAudioUrl] = useState(step.audio_url ?? "");
  const [images, setImages] = useState<string[]>(step.image_urls ?? []);
  const [extraLinks, setExtraLinks] = useState<{ label: string; url: string }[]>(
    step.extra_links ?? [],
  );
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioErr, setAudioErr] = useState<string | null>(null);

  const currentColor = STEP_COLORS[kind];

  useEffect(() => {
    setPosition(step.position);
  }, [step.position]);

  useEffect(() => {
    setDay(step.day ?? 1);
  }, [step.day]);

  async function generateAudio() {
    setAudioErr(null);
    if (isNew) {
      setAudioErr("Save the step first so we can attach audio to it.");
      return;
    }
    const audioText = descLong.trim() || body.trim();
    if (!audioText) {
      setAudioErr("Write the description (or step body) before generating audio.");
      return;
    }
    setAudioBusy(true);
    try {
      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: step.id, text: audioText }),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAudioErr(resBody?.code ?? resBody?.message ?? "Audio generation failed");
        return;
      }
      const newAudioUrl = resBody.audioKey ?? resBody.audioUrl;
      setAudioUrl(newAudioUrl);
      onAudioGenerated(newAudioUrl);
    } catch (err) {
      setAudioErr((err as Error).message);
    } finally {
      setAudioBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    if (!isNew) fd.set("id", step.id);
    fd.set("itinerary_id", itineraryId);
    fd.set("position", String(position));
    fd.set("day", String(day));
    fd.set("kind", kind);
    fd.set("title", title);
    fd.set("day_title", dayTitle);
    fd.set("day_intro", dayIntro);
    fd.set("body", body);
    fd.set("address", address);
    fd.set("info_data", infoData);
    fd.set("description_long", descLong);
    fd.set("description_kids", descKids);
    fd.set("expert_tips", expertTips);
    fd.set("official_url", officialUrl);
    fd.set("google_maps_url", googleMapsUrl);
    fd.set("lat", lat);
    fd.set("lng", lng);
    fd.set("audio_url", audioUrl);
    fd.set("image_urls", JSON.stringify(images));
    fd.set("extra_links", JSON.stringify(extraLinks));

    // Keep parent state in sync so fields do not appear to "disappear"
    // after save (especially when tmp IDs are replaced).
    onPatched({
      position,
      day,
      kind,
      title,
      day_title: dayTitle || null,
      day_intro: dayIntro || null,
      body: body || null,
      address: address || null,
      info_data: infoData || null,
      description_long: descLong || null,
      description_kids: descKids || null,
      expert_tips: expertTips || null,
      official_url: officialUrl || null,
      google_maps_url: googleMapsUrl || null,
      lat: lat.trim() ? Number(lat) : null,
      lng: lng.trim() ? Number(lng) : null,
      audio_url: audioUrl || null,
      image_urls: images,
      extra_links: extraLinks,
    });

    start(async () => {
      const result = await saveStep(fd);
      if (isNew && result?.stepId) onSavedId(result.stepId);
    });
  }

  async function handleDelete() {
    setDeleteErr(null);
    const fd = new FormData();
    fd.set("id", step.id);
    fd.set("itinerary_id", itineraryId);
    start(async () => {
      try {
        await deleteStep(fd);
        onDeleted();
      } catch (err) {
        setDeleteErr((err as Error).message ?? "Delete failed");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-black/[0.06] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${currentColor.hex}15`, color: currentColor.hex }}
          title="Auto-numbered: Step N resets per day; Place/Audio/Tip N resets inside each Step"
        >
          {currentColor.label} {displayNumber}
        </span>
        <label className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Day
          </span>
          <input
            name="day"
            type="number"
            min={1}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            placeholder="1"
            className="w-10 border-0 bg-transparent p-0 text-xs focus:outline-none"
            aria-label="Day number (which day this row belongs to)"
            title="Day number for this row (used to group rows into Day 1, Day 2, etc.)"
          />
        </label>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as ItineraryStepKind)}
          className="rounded-md border border-black/[0.08] px-2 py-1 text-xs"
        >
          <option value="step">Step (blue)</option>
          <option value="pin">Place (green)</option>
          <option value="audio">Audio (red)</option>
          <option value="tip">Tip (yellow)</option>
        </select>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="flex-1 rounded-md border border-black/[0.08] px-3 py-1.5 text-sm min-w-[200px]"
        />
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-foreground/50 hover:text-red-600"
            aria-label="Delete step"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {deleteErr && (
        <p className="text-[11px] text-red-600">{deleteErr}</p>
      )}

      <input
        name="day_title"
        value={dayTitle}
        onChange={(e) => setDayTitle(e.target.value)}
        placeholder="Day title (e.g. The Empire of Little Gladiators) — only on the first step of the day"
        className="w-full rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
      />

      <textarea
        name="day_intro"
        value={dayIntro}
        onChange={(e) => setDayIntro(e.target.value)}
        rows={2}
        placeholder="Day introduction (shown once under the day title — only on first step of the day)"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-xs"
      />

      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="STEP INTRO / INITIAL DESCRIPTION — short intro shown immediately when the step is opened (before the full narrative)"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />

      <input
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        className="w-full rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
      />

      <textarea
        name="info_data"
        value={infoData}
        onChange={(e) => setInfoData(e.target.value)}
        rows={5}
        placeholder="INFO DATA — opening hours, accessibility, pets, water, phone, etc. (collapsible green section on site)"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />

      <textarea
        name="description_long"
        value={descLong}
        onChange={(e) => setDescLong(e.target.value)}
        rows={8}
        placeholder="DESCRIPTION AND AUDIO — full long-form narration. This is what plays as audio when you click Generate audio."
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />

      <textarea
        name="description_kids"
        value={descKids}
        onChange={(e) => setDescKids(e.target.value)}
        rows={6}
        placeholder="AUDIO AND DESCRIPTION (FOR KIDS) — child-friendly version (optional)"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />

      <textarea
        name="expert_tips"
        value={expertTips}
        onChange={(e) => setExpertTips(e.target.value)}
        rows={5}
        placeholder="EXPERT TIPS — practical advice (collapsible yellow section on site)"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />

      <div>
        <MultiImageUploader
          value={images}
          onChange={setImages}
          prefix={`itineraries/${itineraryId}/steps`}
          label="Step images (shown inside the step's description)"
        />
      </div>

      {/* Primary links */}
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          name="official_url"
          value={officialUrl}
          onChange={(e) => setOfficialUrl(e.target.value)}
          placeholder="Official site URL"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
        />
        <input
          name="google_maps_url"
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          placeholder="Google Maps URL"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
        />
      </div>

      {/* Extra links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Additional links
          </p>
          <button
            type="button"
            onClick={() => setExtraLinks([...extraLinks, { label: "", url: "" }])}
            className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-semibold hover:bg-foreground/[0.1]"
          >
            <Link2 className="h-3 w-3" /> Add link
          </button>
        </div>
        {extraLinks.map((link, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              value={link.label}
              onChange={(e) =>
                setExtraLinks(extraLinks.map((l, i) => (i === idx ? { ...l, label: e.target.value } : l)))
              }
              placeholder="Label (e.g. Booking, Tripadvisor)"
              className="w-36 rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
            />
            <input
              value={link.url}
              onChange={(e) =>
                setExtraLinks(extraLinks.map((l, i) => (i === idx ? { ...l, url: e.target.value } : l)))
              }
              placeholder="https://..."
              className="flex-1 rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => setExtraLinks(extraLinks.filter((_, i) => i !== idx))}
              className="text-foreground/40 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <input
          name="lat"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          type="number"
          step="0.000001"
          placeholder="Latitude"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
        />
        <input
          name="lng"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          type="number"
          step="0.000001"
          placeholder="Longitude"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
        />
        <input
          name="audio_url"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          placeholder="Audio URL (optional)"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save step"}
        </button>
        <button
          type="button"
          onClick={generateAudio}
          disabled={audioBusy || !audioReady}
          title={audioReady ? "Generate ElevenLabs audio from the long description" : audioReason}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.08] text-foreground/80 text-xs font-semibold px-4 py-1.5 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {audioBusy ? "Generating…" : "Generate audio"}
        </button>
        {!audioReady && audioReason && (
          <span className="text-[11px] text-foreground/55">{audioReason}</span>
        )}
        {audioErr && <span className="text-[11px] text-red-600">{audioErr}</span>}
      </div>
    </form>
  );
}

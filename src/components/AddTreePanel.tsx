"use client";

import { useState } from "react";
import type { HealthStatus, PlantOrigin, PlantType } from "@/lib/database.types";
import type { NewTreeInput } from "@/lib/api";
import {
  AREA_NOTE_TYPES,
  FEATURE_OPTIONS,
  HEALTH_OPTIONS,
  PLANT_TYPE_META,
  PLANT_TYPE_OPTIONS,
  STATUS_META,
  WILD_PLANTER,
  featureLabel,
} from "@/lib/format";

interface AddTreePanelProps {
  draft: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  defaultPlanter: string;
  onUseGps: () => void;
  onPickOnMap: () => void;
  onSubmit: (input: NewTreeInput) => Promise<void>;
  onCancel: () => void;
}

function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function AddTreePanel({
  draft,
  gpsLoading,
  gpsError,
  defaultPlanter,
  onUseGps,
  onPickOnMap,
  onSubmit,
  onCancel,
}: AddTreePanelProps) {
  const [plantType, setPlantType] = useState<PlantType>("tree");
  const [origin, setOrigin] = useState<PlantOrigin>("planted");
  const [species, setSpecies] = useState("");
  const [plantedOn, setPlantedOn] = useState(todayISO());
  const [planter, setPlanter] = useState(defaultPlanter);
  const [health, setHealth] = useState<HealthStatus>("healthy");
  const [notes, setNotes] = useState("");
  const [areaNote, setAreaNote] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [notability, setNotability] = useState("");
  const [isVeteran, setIsVeteran] = useState(false);
  const [approxAge, setApproxAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observed = origin === "observed";
  const showArea = AREA_NOTE_TYPES.includes(plantType);
  const speciesLabel = observed
    ? "Species (if known)"
    : plantType === "wildflower"
    ? "Species / seed mix *"
    : "Species / type *";

  function toggleFeature(value: string) {
    setFeatures((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  }

  function addCustomFeature() {
    const v = customFeature.trim();
    if (v && !features.includes(v)) setFeatures((prev) => [...prev, v]);
    setCustomFeature("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft) {
      setError("Set the location first (use GPS or tap the map).");
      return;
    }
    if (!observed && !species.trim()) {
      setError("Please enter the species / type.");
      return;
    }
    if (observed && !notability.trim()) {
      setError("For an 'of interest' record, say why it's notable.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        species: species.trim() || "Unknown",
        planted_on: observed ? null : plantedOn || null,
        planted_by_name: observed ? WILD_PLANTER : planter.trim() || "Unknown",
        notes: notes.trim() || null,
        latitude: draft.lat,
        longitude: draft.lng,
        health_status: health,
        plant_type: plantType,
        origin,
        area_note: showArea ? areaNote.trim() || null : null,
        features,
        notability: observed ? notability.trim() || null : null,
        is_veteran: observed ? isVeteran : false,
        approx_age: observed ? approxAge.trim() || null : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-stone-900">🌱 Add a plant</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Location */}
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <span className="text-sm font-medium text-stone-700">Location</span>
          {draft ? (
            <p className="mt-1 font-mono text-xs text-stone-600">
              📍 {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-stone-500">
              Use your GPS, or pick the spot on the map. You can drag the pin to
              fine-tune.
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {gpsLoading ? "Locating…" : "📍 Use my GPS"}
            </button>
            <button
              type="button"
              onClick={onPickOnMap}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              🗺️ Pick on map
            </button>
          </div>
          {gpsError && <p className="mt-2 text-xs text-red-600">{gpsError}</p>}
        </div>

        {/* Origin: planted vs observed */}
        <div>
          <label className="block text-sm font-medium text-stone-700">
            What are you recording?
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrigin("planted")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                !observed
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              🦍 I planted this
            </button>
            <button
              type="button"
              onClick={() => setOrigin("observed")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                observed
                  ? "border-amber-500 bg-amber-50 text-amber-800"
                  : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              👀 Of interest
            </button>
          </div>
          {observed && (
            <p className="mt-1 text-xs text-stone-500">
              An admired tree/plant you didn&apos;t plant. It&apos;ll be recorded as
              planted by “{WILD_PLANTER}”.
            </p>
          )}
        </div>

        {/* Plant type */}
        <div>
          <label className="block text-sm font-medium text-stone-700">Type</label>
          <select
            value={plantType}
            onChange={(e) => setPlantType(e.target.value as PlantType)}
            className={inputClass}
          >
            {PLANT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {PLANT_TYPE_META[t].emoji} {PLANT_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>

        {/* Species */}
        <div>
          <label className="block text-sm font-medium text-stone-700">
            {speciesLabel}
          </label>
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder={
              plantType === "wildflower"
                ? "e.g. Native wildflower mix, Poppy…"
                : "e.g. Silver birch, Oak, Rowan…"
            }
            className={inputClass}
          />
        </div>

        {/* Planted-only fields */}
        {!observed && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Planted on
                </label>
                <input
                  type="date"
                  value={plantedOn}
                  onChange={(e) => setPlantedOn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Health</label>
                <select
                  value={health}
                  onChange={(e) => setHealth(e.target.value as HealthStatus)}
                  className={inputClass}
                >
                  {HEALTH_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].emoji} {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Planted by
              </label>
              <input
                type="text"
                value={planter}
                onChange={(e) => setPlanter(e.target.value)}
                className={inputClass}
              />
            </div>
          </>
        )}

        {/* Observed-only fields */}
        {observed && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Why is it notable? *
              </label>
              <textarea
                value={notability}
                onChange={(e) => setNotability(e.target.value)}
                rows={2}
                placeholder="e.g. Huge old ash — dying of ash dieback but a landmark."
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Health</label>
                <select
                  value={health}
                  onChange={(e) => setHealth(e.target.value as HealthStatus)}
                  className={inputClass}
                >
                  {HEALTH_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].emoji} {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Approx. age
                </label>
                <input
                  type="text"
                  value={approxAge}
                  onChange={(e) => setApproxAge(e.target.value)}
                  placeholder="e.g. ~150 yrs"
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={isVeteran}
                onChange={(e) => setIsVeteran(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-green-700 focus:ring-green-600"
              />
              ⭐ Veteran / ancient tree
            </label>
          </>
        )}

        {/* Area note (patch types) */}
        {showArea && (
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Approx. area / size
            </label>
            <input
              type="text"
              value={areaNote}
              onChange={(e) => setAreaNote(e.target.value)}
              placeholder="e.g. ~5m verge, small patch, 20m hedge line…"
              className={inputClass}
            />
          </div>
        )}

        {/* Fun features */}
        <div>
          <label className="block text-sm font-medium text-stone-700">
            ✨ Fun features <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((f) => {
              const active = features.includes(f);
              const m = featureLabel(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    active
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              );
            })}
            {features
              .filter((f) => !FEATURE_OPTIONS.includes(f))
              .map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className="rounded-full border border-green-600 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800"
                >
                  🔖 {f} ✕
                </button>
              ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomFeature();
                }
              }}
              placeholder="Add your own…"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
            <button
              type="button"
              onClick={addCustomFeature}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything useful — nearby landmarks, watering needs…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      <div className="border-t border-stone-200 px-4 py-3">
        <button
          type="submit"
          disabled={saving || !draft}
          className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : observed ? "Save plant of interest" : "Save plant"}
        </button>
      </div>
    </form>
  );
}

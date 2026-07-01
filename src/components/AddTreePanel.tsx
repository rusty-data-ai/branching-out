"use client";

import { useState } from "react";
import type { HealthStatus } from "@/lib/database.types";
import type { NewTreeInput } from "@/lib/api";
import { HEALTH_OPTIONS, STATUS_META } from "@/lib/format";

interface AddTreePanelProps {
  draft: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  defaultPlanter: string;
  onUseGps: () => void;
  onSubmit: (input: NewTreeInput) => Promise<void>;
  onCancel: () => void;
}

function todayISO(): string {
  // Local YYYY-MM-DD for the date input default.
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
  onSubmit,
  onCancel,
}: AddTreePanelProps) {
  const [species, setSpecies] = useState("");
  const [plantedOn, setPlantedOn] = useState(todayISO());
  const [planter, setPlanter] = useState(defaultPlanter);
  const [health, setHealth] = useState<HealthStatus>("healthy");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft) {
      setError("Set the tree's location first (use GPS or tap the map).");
      return;
    }
    if (!species.trim()) {
      setError("Please enter the tree species / type.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        species: species.trim(),
        planted_on: plantedOn || null,
        planted_by_name: planter.trim() || "Unknown",
        notes: notes.trim() || null,
        latitude: draft.lat,
        longitude: draft.lng,
        health_status: health,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the tree.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-stone-900">🌱 Add a tree</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Location */}
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Location</span>
            <button
              type="button"
              onClick={onUseGps}
              disabled={gpsLoading}
              className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {gpsLoading ? "Locating…" : "📍 Use my GPS"}
            </button>
          </div>
          {draft ? (
            <p className="mt-2 font-mono text-xs text-stone-600">
              {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-stone-500">
              Tap “Use my GPS”, or tap anywhere on the map to drop a pin. You can drag
              the pin to fine-tune.
            </p>
          )}
          {gpsError && <p className="mt-1 text-xs text-red-600">{gpsError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Species / type *
          </label>
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="e.g. Silver birch, Oak, Rowan…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Planted on
            </label>
            <input
              type="date"
              value={plantedOn}
              onChange={(e) => setPlantedOn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Health</label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as HealthStatus)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
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
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything useful — nearby landmarks, why here, watering needs…"
            className="mt-1 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
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
          {saving ? "Planting…" : "Save tree"}
        </button>
      </div>
    </form>
  );
}

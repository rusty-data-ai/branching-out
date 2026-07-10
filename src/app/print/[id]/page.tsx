"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANT_TYPE_META, featureLabel, normalizeTree } from "@/lib/format";
import {
  bearingDegrees,
  compassLabel,
  distanceMeters,
  formatDistance,
  type LatLng,
} from "@/lib/geo";
import type { Tree } from "@/lib/database.types";

const PrintMap = dynamic(() => import("@/components/PrintMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-stone-400">
      Loading map…
    </div>
  ),
});

export default function PrintPage() {
  const params = useParams();
  const id = String(params.id);

  const [tree, setTree] = useState<Tree | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [start, setStart] = useState<LatLng | null>(null);
  const [locState, setLocState] = useState<"loading" | "denied" | "ok">("loading");
  const [mode, setMode] = useState<"gps" | "manual">("gps");

  function locateMe() {
    setMode("gps");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocState("denied");
      return;
    }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStart({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState("ok");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("trees")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setLoadError("Couldn't load this plant.");
        else setTree(normalizeTree(data));
      });
  }, [id]);

  useEffect(() => {
    // Auto-try GPS on load; the user can switch to picking a start manually.
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-stone-600">{loadError}</p>
          <Link href="/map" className="mt-3 inline-block text-green-700 hover:underline">
            ← Back to map
          </Link>
        </div>
      </main>
    );
  }

  if (!tree) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-stone-400">
        Loading…
      </main>
    );
  }

  const typeMeta = PLANT_TYPE_META[tree.plant_type];
  const target: LatLng = { lat: tree.latitude, lng: tree.longitude };
  const title =
    tree.species && tree.species !== "Unknown" ? tree.species : typeMeta.label;
  const dist = start ? distanceMeters(start, target) : null;
  const dir = start ? compassLabel(bearingDegrees(start, target)) : null;

  return (
    <main className="mx-auto max-w-3xl p-4 print:p-0">
      {/* Screen-only controls */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/map" className="text-sm font-semibold text-green-700 hover:underline">
          ← Back to map
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          🖨️ Print this map
        </button>
      </div>

      <div className="rounded-2xl border-4 border-amber-700/40 bg-amber-50 p-5 print:rounded-none print:border-0 print:bg-white print:p-0">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-amber-900">🗺️ Treasure Map</h1>
          <p className="mt-1 text-amber-800">
            Find the <strong>{title}</strong> {typeMeta.emoji}
          </p>
        </header>

        {/* Start-point chooser (screen only) */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 print:hidden">
          <span className="text-sm font-medium text-amber-900">Start point:</span>
          <button
            onClick={locateMe}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              mode === "gps"
                ? "bg-green-700 text-white"
                : "bg-white text-amber-900 ring-1 ring-amber-700/40 hover:bg-amber-100"
            }`}
          >
            📡 Use my GPS
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              mode === "manual"
                ? "bg-green-700 text-white"
                : "bg-white text-amber-900 ring-1 ring-amber-700/40 hover:bg-amber-100"
            }`}
          >
            📍 Pick on map
          </button>
          {mode === "manual" && start && (
            <button
              onClick={() => setStart(null)}
              className="rounded-full px-3 py-1 text-sm font-medium text-amber-800 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="my-4 h-80 overflow-hidden rounded-xl border border-amber-700/30">
          <PrintMap
            start={start}
            target={target}
            targetEmoji={typeMeta.emoji}
            onPick={mode === "manual" ? (ll) => setStart(ll) : undefined}
          />
        </div>

        {/* Directions */}
        <div className="text-center text-sm text-amber-900">
          {mode === "manual" && !start && (
            <p className="print:hidden">
              👆 Tap the map to set your start point (the 🧭).
            </p>
          )}
          {mode === "gps" && locState === "loading" && <p>Finding your location…</p>}
          {start && dist != null && dir && (
            <p>
              🧭 Start at the 🧭, then head{" "}
              <strong>
                {dir.name} {dir.arrow}
              </strong>{" "}
              — about <strong>{formatDistance(dist)}</strong> as the crow flies, to the
              ❌.
            </p>
          )}
          {mode === "gps" && locState === "denied" && !start && (
            <p className="text-amber-800/80">
              (We couldn&apos;t get your location — the map shows where the{" "}
              {typeMeta.label.toLowerCase()} is. Turn on location, or use{" "}
              <strong>📍 Pick on map</strong> to set a start point.)
            </p>
          )}
        </div>

        {/* Clues */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold text-amber-900">🔎 What to look for</h2>
            <ul className="mt-1 space-y-0.5 text-sm text-stone-700">
              <li>
                Type: {typeMeta.emoji} {typeMeta.label}
              </li>
              {tree.species && tree.species !== "Unknown" && (
                <li>Species: {tree.species}</li>
              )}
              {tree.notability && <li>Why it&apos;s special: {tree.notability}</li>}
              {tree.notes && <li>Notes: {tree.notes}</li>}
            </ul>
          </div>

          {tree.features.length > 0 && (
            <div>
              <h2 className="font-semibold text-amber-900">✅ Spotting checklist</h2>
              <ul className="mt-1 space-y-1 text-sm text-stone-700">
                {tree.features.map((f) => {
                  const m = featureLabel(f);
                  return (
                    <li key={f}>
                      ☐ {m.emoji} {m.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-amber-800/70">
          Guerilla Planter · happy exploring! 🌳
        </p>
      </div>
    </main>
  );
}

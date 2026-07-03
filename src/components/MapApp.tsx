"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlantOrigin, PlantType, Tree } from "@/lib/database.types";
import { createTree, type NewTreeInput } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { PLANT_TYPE_META, PLANT_TYPE_OPTIONS } from "@/lib/format";
import type { FlyTarget } from "@/components/MapView";
import AddTreePanel from "@/components/AddTreePanel";
import TreeDetailPanel from "@/components/TreeDetailPanel";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-stone-400">
      Loading map…
    </div>
  ),
});

const DEFAULT_CENTER: [number, number] = [51.4545, -2.5879]; // Bristol, UK
const DEFAULT_ZOOM = 12; // Bristol + surrounding area

interface MapAppProps {
  user: { id: string; name: string };
  initialTrees: Tree[];
}

export default function MapApp({ user, initialTrees }: MapAppProps) {
  const router = useRouter();
  const [trees, setTrees] = useState<Tree[]>(initialTrees);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "add">("idle");
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTarget | null>(null);
  const [addCollapsed, setAddCollapsed] = useState(false);
  const flyNonce = useRef(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState<PlantOrigin | "all">("all");
  const [filterType, setFilterType] = useState<PlantType | "all">("all");
  const [featuresOnly, setFeaturesOnly] = useState(false);
  const filtersActive =
    filterOrigin !== "all" || filterType !== "all" || featuresOnly;

  const filteredTrees = useMemo(
    () =>
      trees.filter((t) => {
        if (filterOrigin !== "all" && t.origin !== filterOrigin) return false;
        if (filterType !== "all" && t.plant_type !== filterType) return false;
        if (featuresOnly && t.features.length === 0) return false;
        return true;
      }),
    [trees, filterOrigin, filterType, featuresOnly]
  );

  const initialCenter = useMemo<[number, number]>(() => {
    if (initialTrees.length === 0) return DEFAULT_CENTER;
    const lat =
      initialTrees.reduce((s, t) => s + t.latitude, 0) / initialTrees.length;
    const lng =
      initialTrees.reduce((s, t) => s + t.longitude, 0) / initialTrees.length;
    return [lat, lng];
  }, [initialTrees]);

  const initialZoom = initialTrees.length > 0 ? 14 : DEFAULT_ZOOM;
  const selectedTree = trees.find((t) => t.id === selectedId) ?? null;

  function fly(lat: number, lng: number, zoom?: number) {
    flyNonce.current += 1;
    setFlyTo({ lat, lng, zoom, nonce: flyNonce.current });
  }

  function handleSelect(id: string) {
    setMode("idle");
    setDraft(null);
    setSelectedId(id);
    const t = trees.find((x) => x.id === id);
    if (t) fly(t.latitude, t.longitude);
  }

  function startAdd() {
    setSelectedId(null);
    setMode("add");
    setDraft(null);
    setAddCollapsed(false);
    requestGps();
  }

  function cancelAdd() {
    setMode("idle");
    setDraft(null);
    setGpsError(null);
    setAddCollapsed(false);
  }

  function requestGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Geolocation isn't available on this device.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDraft(loc);
        fly(loc.lat, loc.lng, 17);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — tap the map to place the pin instead."
            : "Couldn't get your location — tap the map to place the pin."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function submitTree(input: NewTreeInput) {
    const tree = await createTree(input, user.id);
    setTrees((prev) => [tree, ...prev]);
    setMode("idle");
    setDraft(null);
    setAddCollapsed(false);
    setSelectedId(tree.id);
  }

  function handleTreeUpdated(updated: Tree) {
    setTrees((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTreeDeleted(id: string) {
    setTrees((prev) => prev.filter((t) => t.id !== id));
    setSelectedId(null);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const panelOpen = mode === "add" || selectedTree !== null;
  const addCollapsedBar = mode === "add" && addCollapsed;
  const showFullPanel = panelOpen && !addCollapsedBar;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌳</span>
          <span className="font-semibold text-stone-900">Guerilla Planter</span>
          <span className="hidden text-sm text-stone-400 sm:inline">
            · {filtersActive ? `${filteredTrees.length}/${trees.length}` : trees.length}{" "}
            {trees.length === 1 ? "plant" : "plants"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-500 sm:inline">{user.name}</span>
          <Link
            href="/account"
            className="rounded-md border border-stone-300 px-2.5 py-1 text-sm text-stone-600 hover:bg-stone-100"
          >
            Account
          </Link>
          <button
            onClick={signOut}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-sm text-stone-600 hover:bg-stone-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Filters */}
      {mode !== "add" && (
        <div className="absolute left-3 top-14 z-[900]">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm ${
              filtersActive
                ? "border-green-600 bg-green-50 text-green-800"
                : "border-stone-300 bg-white text-stone-700"
            }`}
          >
            ⚲ Filter{filtersActive ? " •" : ""}
          </button>
          {showFilters && (
            <div className="mt-2 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Origin
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      ["all", "All"],
                      ["planted", "🦍 Planted"],
                      ["observed", "👀 Interest"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilterOrigin(val)}
                      className={`rounded-lg border px-1.5 py-1 text-xs font-medium ${
                        filterOrigin === val
                          ? "border-green-600 bg-green-50 text-green-800"
                          : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Type
                </p>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as PlantType | "all")}
                  className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                >
                  <option value="all">All types</option>
                  {PLANT_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {PLANT_TYPE_META[t].emoji} {PLANT_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={featuresOnly}
                  onChange={(e) => setFeaturesOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-green-700 focus:ring-green-600"
                />
                ✨ Only fun features
              </label>

              {filtersActive && (
                <button
                  onClick={() => {
                    setFilterOrigin("all");
                    setFilterType("all");
                    setFeaturesOnly(false);
                  }}
                  className="mt-3 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          trees={filteredTrees}
          selectedId={selectedId}
          onSelectTree={handleSelect}
          addMode={mode === "add"}
          draft={draft}
          onDraftChange={setDraft}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          flyTo={flyTo}
        />
      </div>

      {/* Add-mode hint — only while picking a spot on the (visible) map */}
      {addCollapsedBar && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[900] flex justify-center px-4">
          <div className="rounded-full bg-stone-900/85 px-4 py-1.5 text-sm text-white shadow">
            Tap the map to place the pin
          </div>
        </div>
      )}

      {/* Floating add button */}
      {mode === "idle" && !selectedTree && (
        <button
          onClick={startAdd}
          className="absolute bottom-6 right-5 z-[900] flex items-center gap-2 rounded-full bg-green-700 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-green-800"
        >
          <span className="text-lg leading-none">＋</span> Add plant
        </button>
      )}

      {/* Collapsed add bar: shown while the user is picking a location on the map */}
      {addCollapsedBar && (
        <div className="absolute inset-x-0 bottom-0 z-[1000] border-t border-stone-200 bg-white p-3 shadow-2xl md:left-auto md:right-0 md:w-96 md:rounded-l-2xl md:border">
          <p className="text-center text-sm text-stone-700">
            {draft
              ? `📍 Pin set — ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`
              : "Tap the map to place the pin"}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={requestGps}
              disabled={gpsLoading}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              {gpsLoading ? "Locating…" : "📍 Use my GPS"}
            </button>
            <button
              onClick={() => setAddCollapsed(false)}
              className="flex-1 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Back to details →
            </button>
          </div>
        </div>
      )}

      {/* Panel: bottom sheet on mobile, right drawer on desktop */}
      {showFullPanel && (
        <div className="absolute inset-x-0 bottom-0 z-[1000] flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-stone-200 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none md:rounded-l-2xl md:pt-12">
          {mode === "add" ? (
            <AddTreePanel
              draft={draft}
              gpsLoading={gpsLoading}
              gpsError={gpsError}
              defaultPlanter={user.name}
              onUseGps={requestGps}
              onPickOnMap={() => setAddCollapsed(true)}
              onSubmit={submitTree}
              onCancel={cancelAdd}
            />
          ) : selectedTree ? (
            <TreeDetailPanel
              tree={selectedTree}
              currentUserId={user.id}
              currentUserName={user.name}
              onClose={() => setSelectedId(null)}
              onTreeUpdated={handleTreeUpdated}
              onTreeDeleted={handleTreeDeleted}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

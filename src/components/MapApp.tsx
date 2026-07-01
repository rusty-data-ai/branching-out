"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tree } from "@/lib/database.types";
import { createTree, type NewTreeInput } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
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
  const flyNonce = useRef(0);

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
    requestGps();
  }

  function cancelAdd() {
    setMode("idle");
    setDraft(null);
    setGpsError(null);
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

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌳</span>
          <span className="font-semibold text-stone-900">Guerilla Planting</span>
          <span className="hidden text-sm text-stone-400 sm:inline">
            · {trees.length} {trees.length === 1 ? "tree" : "trees"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-500 sm:inline">{user.name}</span>
          <button
            onClick={signOut}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-sm text-stone-600 hover:bg-stone-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          trees={trees}
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

      {/* Add-mode hint */}
      {mode === "add" && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[900] flex justify-center px-4">
          <div className="rounded-full bg-stone-900/85 px-4 py-1.5 text-sm text-white shadow">
            Tap the map to place the pin, or use GPS →
          </div>
        </div>
      )}

      {/* Floating add button */}
      {mode === "idle" && !selectedTree && (
        <button
          onClick={startAdd}
          className="absolute bottom-6 right-5 z-[900] flex items-center gap-2 rounded-full bg-green-700 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-green-800"
        >
          <span className="text-lg leading-none">＋</span> Add tree
        </button>
      )}

      {/* Panel: bottom sheet on mobile, right drawer on desktop */}
      {panelOpen && (
        <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[78vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-stone-200 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none md:rounded-l-2xl md:pt-12">
          {mode === "add" ? (
            <AddTreePanel
              draft={draft}
              gpsLoading={gpsLoading}
              gpsError={gpsError}
              defaultPlanter={user.name}
              onUseGps={requestGps}
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

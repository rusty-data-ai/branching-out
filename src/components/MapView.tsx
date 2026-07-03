"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Tree } from "@/lib/database.types";
import { treeMarkerHtml } from "@/lib/format";

export interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
  nonce: number;
}

interface MapViewProps {
  trees: Tree[];
  selectedId: string | null;
  onSelectTree: (id: string) => void;
  addMode: boolean;
  draft: { lat: number; lng: number } | null;
  onDraftChange: (latlng: { lat: number; lng: number }) => void;
  initialCenter: [number, number];
  initialZoom: number;
  flyTo: FlyTarget | null;
}

function treeIcon(tree: Tree, selected: boolean) {
  return L.divIcon({
    html: `<div style="transform:${selected ? "scale(1.25)" : "scale(1)"};transition:transform .1s">${treeMarkerHtml(
      tree.health_status,
      tree.needs_attention
    )}</div>`,
    className: "tree-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const draftIcon = L.divIcon({
  html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">📍</div>`,
  className: "tree-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/** Listens for map clicks; in add mode each click moves the draft pin. */
function ClickHandler({
  addMode,
  onDraftChange,
}: {
  addMode: boolean;
  onDraftChange: (latlng: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (addMode) onDraftChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Fixes the "patchwork of grey tiles" that happens when the map mounts before
 *  its container has its final size — recalculates once things settle, and on resize. */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t1 = setTimeout(fix, 150);
    const t2 = setTimeout(fix, 600);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

/** Imperatively flies the map when `flyTo.nonce` changes. */
function FlyController({ flyTo }: { flyTo: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? map.getZoom(), {
        duration: 0.6,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.nonce]);
  return null;
}

export default function MapView({
  trees,
  selectedId,
  onSelectTree,
  addMode,
  draft,
  onDraftChange,
  initialCenter,
  initialZoom,
  flyTo,
}: MapViewProps) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <InvalidateSize />
      <ClickHandler addMode={addMode} onDraftChange={onDraftChange} />
      <FlyController flyTo={flyTo} />

      {trees.map((tree) => (
        <Marker
          key={tree.id}
          position={[tree.latitude, tree.longitude]}
          icon={treeIcon(tree, tree.id === selectedId)}
          eventHandlers={{ click: () => onSelectTree(tree.id) }}
        />
      ))}

      {addMode && draft && (
        <Marker
          position={[draft.lat, draft.lng]}
          icon={draftIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = e.target.getLatLng();
              onDraftChange({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

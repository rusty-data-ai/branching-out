"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng } from "@/lib/geo";

const startIcon = L.divIcon({
  html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">🧭</div>`,
  className: "tree-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function targetIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="position:relative;font-size:24px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">${emoji}<span style="position:absolute;top:-8px;right:-11px;font-size:15px">❌</span></div>`,
    className: "tree-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  // Refit only when the *number* of points changes (i.e. a start first
  // appears), not on every pick — so nudging the start point doesn't yank the
  // map around while the user is placing it.
  const hasStart = points.length > 1;
  const target = points[points.length - 1].join(",");
  useEffect(() => {
    if (!hasStart) {
      map.setView(points[points.length - 1], 17);
    } else {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    }
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hasStart, target]);
  return null;
}

function PickHandler({ onPick }: { onPick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface PrintMapProps {
  start: LatLng | null;
  target: LatLng;
  targetEmoji: string;
  onPick?: (ll: LatLng) => void;
}

export default function PrintMap({ start, target, targetEmoji, onPick }: PrintMapProps) {
  const points: [number, number][] = start
    ? [
        [start.lat, start.lng],
        [target.lat, target.lng],
      ]
    : [[target.lat, target.lng]];

  return (
    <MapContainer
      center={[target.lat, target.lng]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Fit points={points} />
      {onPick && <PickHandler onPick={onPick} />}
      {start && (
        <Polyline
          positions={[
            [start.lat, start.lng],
            [target.lat, target.lng],
          ]}
          pathOptions={{ color: "#b45309", weight: 3, dashArray: "8 8" }}
        />
      )}
      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      <Marker position={[target.lat, target.lng]} icon={targetIcon(targetEmoji)} />
    </MapContainer>
  );
}

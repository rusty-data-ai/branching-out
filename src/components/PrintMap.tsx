"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
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
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 17);
    } else {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    }
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map, points]);
  return null;
}

interface PrintMapProps {
  start: LatLng | null;
  target: LatLng;
  targetEmoji: string;
}

export default function PrintMap({ start, target, targetEmoji }: PrintMapProps) {
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

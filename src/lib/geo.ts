export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance between two points, in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Human-friendly distance, e.g. "320 m" or "1.4 km". */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/** Initial compass bearing from a → b, in degrees (0 = north). */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS: Array<{ name: string; arrow: string }> = [
  { name: "north", arrow: "⬆️" },
  { name: "north-east", arrow: "↗️" },
  { name: "east", arrow: "➡️" },
  { name: "south-east", arrow: "↘️" },
  { name: "south", arrow: "⬇️" },
  { name: "south-west", arrow: "↙️" },
  { name: "west", arrow: "⬅️" },
  { name: "north-west", arrow: "↖️" },
];

/** Map a bearing to a spoken compass direction + arrow emoji. */
export function compassLabel(deg: number): { name: string; arrow: string } {
  return COMPASS[Math.round(deg / 45) % 8];
}

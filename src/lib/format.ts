import type { CareAction, HealthStatus } from "@/lib/database.types";

export const STATUS_META: Record<
  HealthStatus,
  { label: string; color: string; emoji: string }
> = {
  thriving: { label: "Thriving", color: "#15803d", emoji: "🌳" },
  healthy: { label: "Healthy", color: "#4d7c0f", emoji: "🌲" },
  struggling: { label: "Struggling", color: "#b45309", emoji: "🍂" },
  dead: { label: "Dead", color: "#78716c", emoji: "🪾" },
};

export const HEALTH_OPTIONS: HealthStatus[] = [
  "thriving",
  "healthy",
  "struggling",
  "dead",
];

export const CARE_ACTION_META: Record<
  CareAction,
  { label: string; emoji: string }
> = {
  watered: { label: "Watered", emoji: "💧" },
  checked: { label: "Checked on", emoji: "👀" },
  flagged_attention: { label: "Flagged as needing attention", emoji: "🚩" },
  resolved_attention: { label: "Marked as OK again", emoji: "✅" },
  status_change: { label: "Updated health", emoji: "🩺" },
  note: { label: "Note", emoji: "📝" },
};

/** Build the HTML for a Leaflet divIcon representing a tree's status. */
export function treeMarkerHtml(status: HealthStatus, needsAttention: boolean): string {
  const meta = STATUS_META[status];
  const ring = needsAttention ? "box-shadow:0 0 0 3px #dc2626;" : "";
  const flag = needsAttention
    ? `<span style="position:absolute;top:-6px;right:-6px;font-size:12px;line-height:1">🚩</span>`
    : "";
  return `
    <div style="position:relative">
      <div style="
        width:30px;height:30px;border-radius:9999px;
        background:${meta.color};${ring}
        border:2px solid white;display:flex;align-items:center;justify-content:center;
        font-size:16px;line-height:1">
        ${meta.emoji}
      </div>
      ${flag}
    </div>`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown date";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

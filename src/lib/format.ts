import type {
  CareAction,
  HealthStatus,
  PlantOrigin,
  PlantType,
  Tree,
} from "@/lib/database.types";

/** Fill in defaults for the plant-type/origin/features columns so the app is
 *  resilient to rows created before migration 002 was applied. */
export function normalizeTree(row: Tree): Tree {
  return {
    ...row,
    plant_type: row.plant_type ?? "tree",
    origin: row.origin ?? "planted",
    area_note: row.area_note ?? null,
    features: row.features ?? [],
    notability: row.notability ?? null,
    is_veteran: row.is_veteran ?? false,
    approx_age: row.approx_age ?? null,
  };
}

export const STATUS_META: Record<
  HealthStatus,
  { label: string; color: string; emoji: string }
> = {
  thriving: { label: "Thriving", color: "#15803d", emoji: "🌳" },
  healthy: { label: "Healthy", color: "#4d7c0f", emoji: "🌲" },
  struggling: { label: "Struggling", color: "#b45309", emoji: "🍂" },
  dead: { label: "Dead", color: "#78716c", emoji: "🪾" },
};

// --- Plant types (issue #1) ------------------------------------------
export const PLANT_TYPE_META: Record<
  PlantType,
  { label: string; emoji: string; color: string }
> = {
  tree: { label: "Tree", emoji: "🌳", color: "#15803d" },
  wildflower: { label: "Wildflower", emoji: "🌼", color: "#ca8a04" },
  shrub: { label: "Shrub / bush", emoji: "🌿", color: "#4d7c0f" },
  hedge: { label: "Hedge", emoji: "🌲", color: "#166534" },
  fruit_bush: { label: "Fruit bush / tree", emoji: "🍓", color: "#be123c" },
  climber: { label: "Climber", emoji: "🍃", color: "#0d9488" },
  other: { label: "Other", emoji: "🪴", color: "#6b7280" },
};

export const PLANT_TYPE_OPTIONS: PlantType[] = [
  "tree",
  "wildflower",
  "shrub",
  "hedge",
  "fruit_bush",
  "climber",
  "other",
];

// Types for which an "approx. area / size" note is offered.
export const AREA_NOTE_TYPES: PlantType[] = ["wildflower", "hedge", "shrub", "climber"];

// --- Fun features (issue #2) -----------------------------------------
// Predefined quick-pick tags. Custom entries are stored as free text and
// rendered with a generic icon.
export const FEATURE_META: Record<string, { label: string; emoji: string }> = {
  fairy_door: { label: "Fairy door", emoji: "🚪" },
  rope_swing: { label: "Rope swing", emoji: "🪢" },
  tree_house: { label: "Tree house / den", emoji: "🏠" },
  good_climbing: { label: "Good for climbing", emoji: "🧗" },
  hollow: { label: "Hollow / hidey-hole", emoji: "🕳️" },
  conkers_berries: { label: "Conkers / berries", emoji: "🌰" },
  bird_box: { label: "Bird box / nest", emoji: "🐦" },
  carved_faces: { label: "Carved faces / bark", emoji: "😀" },
};

export const FEATURE_OPTIONS: string[] = Object.keys(FEATURE_META);

export function featureLabel(value: string): { label: string; emoji: string } {
  return FEATURE_META[value] ?? { label: value, emoji: "🔖" };
}

// --- Origin (issue #3) -----------------------------------------------
export const ORIGIN_META: Record<PlantOrigin, { label: string; emoji: string }> = {
  planted: { label: "Planted by a member", emoji: "🌱" },
  observed: { label: "Of interest (observed)", emoji: "⭐" },
};

// Default "planted by" attribution for observed / wild records.
export const WILD_PLANTER = "Wild";

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

export interface MarkerSpec {
  plantType: PlantType;
  healthStatus: HealthStatus;
  needsAttention: boolean;
  origin: PlantOrigin;
  hasFeatures: boolean;
}

/** Build the HTML for a Leaflet divIcon.
 *  Background colour + emoji = plant type; a small dot = health; an amber
 *  dashed ring + ⭐ = an observed "of interest" record; ✨ = has fun features;
 *  a red ring + 🚩 = needs attention. */
export function plantMarkerHtml(spec: MarkerSpec): string {
  const type = PLANT_TYPE_META[spec.plantType];
  const health = STATUS_META[spec.healthStatus];
  const planted = spec.origin === "planted";

  const ring = spec.needsAttention ? "box-shadow:0 0 0 3px #dc2626;" : "";

  const attentionFlag = spec.needsAttention
    ? `<span style="position:absolute;top:-7px;right:-7px;font-size:12px;line-height:1">🚩</span>`
    : "";
  const featureSpark = spec.hasFeatures
    ? `<span style="position:absolute;top:-7px;left:-7px;font-size:12px;line-height:1">✨</span>`
    : "";
  // Guerilla-planted plants get a gorilla badge; "of interest" plants are the
  // plain default (no badge).
  const gorillaBadge = planted
    ? `<span style="position:absolute;bottom:-8px;left:-8px;font-size:15px;line-height:1;filter:drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)">🦍</span>`
    : "";
  const healthDot = `<span style="position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:9999px;background:${health.color};border:2px solid white"></span>`;

  return `
    <div style="position:relative;width:30px;height:30px">
      <div style="
        width:30px;height:30px;border-radius:9999px;
        background:${type.color};border:2px solid white;${ring}
        display:flex;align-items:center;justify-content:center;
        font-size:16px;line-height:1">
        ${type.emoji}
      </div>
      ${healthDot}${attentionFlag}${featureSpark}${gorillaBadge}
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

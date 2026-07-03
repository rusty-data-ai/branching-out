"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CareLog, HealthStatus, Tree, TreePhoto } from "@/lib/database.types";
import {
  addCareLog,
  deleteTree,
  fetchCareLogs,
  fetchPhotos,
  photoUrl,
  updateTree,
  uploadPhoto,
} from "@/lib/api";
import {
  CARE_ACTION_META,
  HEALTH_OPTIONS,
  PLANT_TYPE_META,
  STATUS_META,
  featureLabel,
  formatDate,
  formatDateTime,
} from "@/lib/format";

interface TreeDetailPanelProps {
  tree: Tree;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onTreeUpdated: (tree: Tree) => void;
  onTreeDeleted: (id: string) => void;
}

export default function TreeDetailPanel({
  tree,
  currentUserId,
  currentUserName,
  onClose,
  onTreeUpdated,
  onTreeDeleted,
}: TreeDetailPanelProps) {
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [photos, setPhotos] = useState<TreePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = STATUS_META[tree.health_status];
  const typeMeta = PLANT_TYPE_META[tree.plant_type];
  const observed = tree.origin === "observed";
  const title =
    tree.species && tree.species !== "Unknown" ? tree.species : typeMeta.label;
  const isOwner = tree.created_by === currentUserId;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchCareLogs(tree.id), fetchPhotos(tree.id)])
      .then(([l, p]) => {
        if (!active) return;
        setLogs(l);
        setPhotos(p);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tree.id]);

  async function logCare(action: CareLog["action"], note?: string) {
    setBusy(true);
    setError(null);
    try {
      const entry = await addCareLog({
        treeId: tree.id,
        userId: currentUserId,
        authorName: currentUserName,
        action,
        note: note ?? null,
      });
      setLogs((prev) => [entry, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function changeHealth(status: HealthStatus) {
    if (status === tree.health_status) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateTree(tree.id, { health_status: status });
      onTreeUpdated(updated);
      await logCare("status_change", `Health set to ${STATUS_META[status].label}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAttention() {
    setBusy(true);
    setError(null);
    const next = !tree.needs_attention;
    try {
      const updated = await updateTree(tree.id, { needs_attention: next });
      onTreeUpdated(updated);
      await logCare(next ? "flagged_attention" : "resolved_attention");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await uploadPhoto({ treeId: tree.id, userId: currentUserId, file });
      setPhotos((prev) => [photo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this tree and all its care history? This cannot be undone."))
      return;
    setBusy(true);
    try {
      await deleteTree(tree.id);
      onTreeDeleted(tree.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-stone-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            {typeMeta.emoji} {title}
          </h2>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {typeMeta.emoji} {typeMeta.label}
            </span>
            {observed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                ⭐ Of interest
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
            {tree.needs_attention && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                🚩 Needs attention
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Facts */}
        <dl className="space-y-1.5 text-sm">
          {observed ? (
            <>
              {tree.notability && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-stone-500">Why notable</dt>
                  <dd className="whitespace-pre-wrap text-stone-800">
                    {tree.notability}
                  </dd>
                </div>
              )}
              {(tree.approx_age || tree.is_veteran) && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-stone-500">Age</dt>
                  <dd className="text-stone-800">
                    {[tree.is_veteran ? "⭐ Veteran / ancient" : null, tree.approx_age]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-stone-500">Recorded as</dt>
                <dd className="text-stone-800">{tree.planted_by_name}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-stone-500">Planted</dt>
                <dd className="text-stone-800">{formatDate(tree.planted_on)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-stone-500">Planted by</dt>
                <dd className="text-stone-800">{tree.planted_by_name}</dd>
              </div>
            </>
          )}
          {tree.area_note && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-stone-500">Area / size</dt>
              <dd className="text-stone-800">{tree.area_note}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-stone-500">Location</dt>
            <dd className="font-mono text-xs text-stone-700">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${tree.latitude},${tree.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline"
              >
                {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)} ↗
              </a>
            </dd>
          </div>
          {tree.notes && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-stone-500">Notes</dt>
              <dd className="whitespace-pre-wrap text-stone-800">{tree.notes}</dd>
            </div>
          )}
        </dl>

        <Link
          href={`/print/${tree.id}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-amber-500 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          🗺️ Print treasure map
        </Link>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {/* Fun features */}
        {tree.features.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              ✨ Fun features
            </h3>
            <div className="flex flex-wrap gap-2">
              {tree.features.map((f) => {
                const m = featureLabel(f);
                return (
                  <span
                    key={f}
                    className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                  >
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Maintenance actions */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Maintenance
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => logCare("watered")}
              disabled={busy}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              💧 Watered
            </button>
            <button
              onClick={() => logCare("checked")}
              disabled={busy}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              👀 Checked
            </button>
            <button
              onClick={toggleAttention}
              disabled={busy}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                tree.needs_attention
                  ? "border border-green-600 bg-green-50 text-green-800 hover:bg-green-100"
                  : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {tree.needs_attention ? "✅ Mark OK" : "🚩 Needs attention"}
            </button>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-stone-700">
              Update health
            </label>
            <select
              value={tree.health_status}
              disabled={busy}
              onChange={(e) => changeHealth(e.target.value as HealthStatus)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:opacity-50"
            >
              {HEALTH_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].emoji} {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Photos */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Photos
            </h3>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-50"
            >
              + Add photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoSelected}
            />
          </div>
          {photos.length === 0 ? (
            <p className="text-sm text-stone-400">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={photoUrl(p.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg bg-stone-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(p.storage_path)}
                    alt="Tree"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Care timeline */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Care history
          </h3>
          {loading ? (
            <p className="text-sm text-stone-400">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-stone-400">No care logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => {
                const m = CARE_ACTION_META[log.action];
                return (
                  <li key={log.id} className="flex gap-2 text-sm">
                    <span>{m.emoji}</span>
                    <div>
                      <span className="text-stone-800">{m.label}</span>
                      {log.note && (
                        <span className="text-stone-600"> — {log.note}</span>
                      )}
                      <div className="text-xs text-stone-400">
                        {log.author_name} · {formatDateTime(log.created_at)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="border-t border-stone-200 px-4 py-3">
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Delete this tree
          </button>
        </div>
      )}
    </div>
  );
}

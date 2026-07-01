import { createClient } from "@/lib/supabase/client";
import type {
  CareAction,
  CareLog,
  HealthStatus,
  Tree,
  TreePhoto,
} from "@/lib/database.types";

const PHOTO_BUCKET = "tree-photos";

export async function fetchTrees(): Promise<Tree[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface NewTreeInput {
  species: string;
  planted_on: string | null;
  planted_by_name: string;
  notes: string | null;
  latitude: number;
  longitude: number;
  health_status: HealthStatus;
}

export async function createTree(
  input: NewTreeInput,
  userId: string
): Promise<Tree> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trees")
    .insert({ ...input, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTree(treeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("trees").delete().eq("id", treeId);
  if (error) throw error;
}

/** Update health status and (optionally) the needs-attention flag, returning the row. */
export async function updateTree(
  treeId: string,
  patch: Partial<Pick<Tree, "health_status" | "needs_attention">>
): Promise<Tree> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trees")
    .update(patch)
    .eq("id", treeId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCareLogs(treeId: string): Promise<CareLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_logs")
    .select("*")
    .eq("tree_id", treeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addCareLog(args: {
  treeId: string;
  userId: string;
  authorName: string;
  action: CareAction;
  note?: string | null;
}): Promise<CareLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_logs")
    .insert({
      tree_id: args.treeId,
      user_id: args.userId,
      author_name: args.authorName,
      action: args.action,
      note: args.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPhotos(treeId: string): Promise<TreePhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tree_photos")
    .select("*")
    .eq("tree_id", treeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function photoUrl(storagePath: string): string {
  const supabase = createClient();
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function uploadPhoto(args: {
  treeId: string;
  userId: string;
  file: File;
}): Promise<TreePhoto> {
  const supabase = createClient();
  const ext = args.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${args.treeId}/${Date.now()}-${rand}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, args.file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("tree_photos")
    .insert({ tree_id: args.treeId, user_id: args.userId, storage_path: path })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MapApp from "@/components/MapApp";
import type { Tree } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but double-check for safety.
  if (!user) redirect("/login");

  const [{ data: profile }, { data: trees }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("trees")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const name =
    profile?.display_name ||
    (user.user_metadata?.display_name as string | undefined) ||
    "Anonymous planter";

  return (
    <MapApp user={{ id: user.id, name }} initialTrees={(trees as Tree[]) ?? []} />
  );
}

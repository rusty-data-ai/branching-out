import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-16 text-center">
      <div className="max-w-xl">
        <div className="mb-4 text-6xl">🌳</div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Guerilla Planting
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Map the trees you plant in the wild, then come back to water, check and
          care for them. A shared registry so no sapling gets forgotten.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/map"
              className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800 sm:w-auto"
            >
              Open the map →
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800 sm:w-auto"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="w-full rounded-lg border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100 sm:w-auto"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <ul className="mx-auto mt-10 grid max-w-md gap-3 text-left text-sm text-stone-600">
          <li className="flex gap-2">
            <span>📍</span> Record a tree&apos;s exact spot using your phone&apos;s GPS.
          </li>
          <li className="flex gap-2">
            <span>💧</span> Log watering and check-ups so saplings survive.
          </li>
          <li className="flex gap-2">
            <span>📷</span> Add photos and track each tree&apos;s health over time.
          </li>
        </ul>
      </div>
    </main>
  );
}

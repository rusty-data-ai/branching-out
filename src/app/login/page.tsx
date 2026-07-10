"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Convenience test login: typing "test" in the email field (with password
// "test") signs in as the shared test account, whose real address is below.
// Create it once by running supabase/migrations/003_test_user.sql.
const TEST_USERNAME = "test";
const TEST_EMAIL = "test@guerilla.test";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/map";
  const justConfirmed = searchParams.get("confirmed") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const entered = email.trim();
    const resolvedEmail =
      entered.toLowerCase() === TEST_USERNAME ? TEST_EMAIL : entered;
    const { error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });
    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "Please confirm your email first — check your inbox for the link."
          : error.message
      );
      setLoading(false);
      return;
    }
    router.replace(redirectedFrom);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <div className="mb-6 text-center">
          <div className="text-4xl">🌳</div>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to the tree registry</p>
        </div>

        {justConfirmed && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            ✅ Your email is confirmed — sign in to get started.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input
              type="text"
              inputMode="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-green-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-green-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

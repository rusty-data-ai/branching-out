"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: displayName.trim() || "Anonymous planter" },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <div className="text-4xl">📬</div>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Check your email</h1>
          <p className="mt-3 text-sm text-stone-600">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-semibold text-stone-900">{email}</span>. Click it to
            activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white transition hover:bg-green-800"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <div className="mb-6 text-center">
          <div className="text-4xl">🌱</div>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Join the planters</h1>
          <p className="mt-1 text-sm text-stone-500">
            Create an account to add and care for trees
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Display name
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="e.g. Robin"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
            <p className="mt-1 text-xs text-stone-400">
              Shown as who planted/cared for a tree.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
            <p className="mt-1 text-xs text-stone-400">At least 6 characters.</p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

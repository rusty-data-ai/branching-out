"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl">📬</div>
            <h1 className="mt-2 text-2xl font-bold text-stone-900">Check your email</h1>
            <p className="mt-3 text-sm text-stone-600">
              If an account exists for{" "}
              <span className="font-semibold text-stone-900">{email}</span>, we&apos;ve
              sent a link to reset your password. Open it and you&apos;ll be able to set a
              new one.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white transition hover:bg-green-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="text-4xl">🔑</div>
              <h1 className="mt-2 text-2xl font-bold text-stone-900">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                We&apos;ll email you a link to set a new one.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-green-700 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

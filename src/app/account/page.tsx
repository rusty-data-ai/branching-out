"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? null);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50 px-6 py-10">
      <div className="mx-auto max-w-sm">
        <Link href="/map" className="text-sm font-semibold text-green-700 hover:underline">
          ← Back to map
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-bold text-stone-900">Account</h1>
          {email && (
            <p className="mt-1 text-sm text-stone-500">
              Signed in as <span className="font-medium text-stone-700">{email}</span>
            </p>
          )}

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Change password
          </h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                New password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Confirm new password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {done && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                ✅ Password updated.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

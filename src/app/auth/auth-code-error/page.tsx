import Link from "next/link";

export default function AuthCodeError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-stone-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="text-4xl">⚠️</div>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Link expired</h1>
        <p className="mt-3 text-sm text-stone-600">
          That confirmation link was invalid or has already been used. Try signing in,
          or request a new link by signing up again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white transition hover:bg-green-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

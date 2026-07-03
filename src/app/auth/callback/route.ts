import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles the email-confirmation (and password-recovery) redirect from Supabase.
// Supports both flows:
//   * PKCE:      ?code=...            -> exchangeCodeForSession
//   * OTP link:  ?token_hash=&type=  -> verifyOtp
// If neither can create a session here (e.g. the link was opened in a different
// browser than the one that signed up), Supabase has still confirmed the email,
// so we send the user to sign in with a friendly note rather than a scary error.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/map";

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Confirmation was processed by Supabase even if we couldn't open a session here.
  return NextResponse.redirect(`${origin}/login?confirmed=1`);
}

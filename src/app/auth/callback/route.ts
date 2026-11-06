import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { safeRedirect } from "../../../lib/safeRedirect";

// Google and magic links both land here with a one-time code, which we swap for a session
// GET /auth/callback?code=...&next=/movies
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth&next=${encodeURIComponent(next)}`);
}

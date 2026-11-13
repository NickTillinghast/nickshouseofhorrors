import { NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";
import { safeRedirect } from "@lib/safeRedirect";
import { SITE_URL } from "@lib/site";

// Google and magic links both land here with a one-time code, which we swap for a session
// GET /auth/callback?code=...&next=/movies
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  // Not request.url's origin: behind CloudFront that's the server's own internal address
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${SITE_URL}${next}`);
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth&next=${encodeURIComponent(next)}`);
}

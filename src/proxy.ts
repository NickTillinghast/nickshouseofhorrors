import { timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Files that never need the Supabase session refreshed
const STATIC_PATH = /^\/(_next\/static|_next\/image|favicon\.ico|icon\.svg|assets\/)/;

// On AWS, CloudFront adds a secret header to every request it forwards. Anything without it
// came straight to the Lambda's own address, skipping CloudFront, and is turned away.
// Off when ORIGIN_VERIFY_SECRET isn't set (local development)
function fromCloudFront(request: NextRequest) {
  const secret = process.env.ORIGIN_VERIFY_SECRET;
  if (!secret) return true;
  // The Lambda Web Adapter checks this from inside the container before sending traffic
  if (request.nextUrl.pathname === "/api/health") return true;

  const sent = Buffer.from(request.headers.get("x-origin-verify") ?? "");
  const expected = Buffer.from(secret);
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}

export async function proxy(request: NextRequest) {
  if (!fromCloudFront(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (STATIC_PATH.test(request.nextUrl.pathname)) return NextResponse.next();

  // Keeps the Supabase login fresh: an expired session gets new cookies before the page renders.
  // Only refreshes, pages decide for themselves who can see what
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Pass the new cookies to the page being rendered and back to the browser
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
          // A response carrying someone's login cookies must never be cached and shown to others
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Every path, so the CloudFront check covers images and static files too
  matcher: ["/:path*"],
};

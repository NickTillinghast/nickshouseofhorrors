import { createBrowserClient } from "@supabase/ssr";

// For Client Components. Row Level Security keeps the public key safe to ship to the browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

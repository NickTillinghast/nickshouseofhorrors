import "server-only";
import { createClient } from "@supabase/supabase-js";

// Full access, skips Row Level Security. Only for trusted server code that writes data
// players must not be able to touch themselves, like quiz scores. Never import from the browser
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

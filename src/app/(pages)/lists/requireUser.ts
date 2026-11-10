import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// For pages only signed-in people can see. Sends everyone else to sign in, then back here
export async function requireUser(next: string) {
  // Supabase checks the session expiry with Date.now(), so wait for a real request first
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, username: (profile?.username as string | undefined) ?? null };
}

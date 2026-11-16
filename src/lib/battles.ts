import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

export * from "./battleShared";
import type { Battle } from "./battleShared";

export const BATTLES_TAG = "battles";

// Public reads (Row Level Security only shows published battles), no login cookie needed
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const BATTLE_SELECT =
  "id, slug, tagline, published_at, left_fighter:battle_fighters!battles_left_fighter_id_fkey(name, image), right_fighter:battle_fighters!battles_right_fighter_id_fkey(name, image)";

type BattleRow = {
  id: number;
  slug: string;
  tagline: string | null;
  published_at: string;
  left_fighter: { name: string; image: string };
  right_fighter: { name: string; image: string };
};

function toBattle(row: BattleRow): Battle {
  return {
    id: row.id,
    slug: row.slug,
    tagline: row.tagline,
    publishedAt: row.published_at,
    left: row.left_fighter,
    right: row.right_fighter,
  };
}

// Every published battle, newest first. Battles are added in the Supabase dashboard,
// so this refreshes on its own every few minutes instead of waiting for a site action
export async function getBattles(): Promise<Battle[]> {
  "use cache";
  cacheTag(BATTLES_TAG);
  cacheLife("minutes");

  const { data, error } = await publicClient()
    .from("battles")
    .select(BATTLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(200)
    .overrideTypes<BattleRow[], { merge: false }>();
  // Shows up in CloudWatch, so a broken query doesn't just look like "no battles"
  if (error) console.error("Couldn't load battles:", error.message);
  return (data ?? []).map(toBattle);
}

export async function getBattle(slug: string): Promise<Battle | null> {
  const battles = await getBattles();
  return battles.find((battle) => battle.slug === slug) ?? null;
}

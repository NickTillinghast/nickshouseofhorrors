// Battle types and helpers that are safe in the browser too (no "use cache" here)

export type Fighter = { name: string; image: string };

export type Battle = {
  id: number;
  slug: string;
  tagline: string | null;
  publishedAt: string;
  left: Fighter;
  right: Fighter;
};

export type BattleSide = "left" | "right";

export type BattleCounts = { left: number; right: number };

export const BATTLES_PATH = "/blood-bathroom";
export const BATTLES_LABEL = "Blood Bathroom";

export function battleHref(battle: Pick<Battle, "slug">) {
  return `${BATTLES_PATH}/${battle.slug}`;
}

export function battleTitle(battle: Pick<Battle, "left" | "right">) {
  return `${battle.left.name} vs ${battle.right.name}`;
}

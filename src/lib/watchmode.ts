import { cacheLife } from "next/cache";

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";

export type WatchSource = {
  source_id: number;
  name: string;
  // sub = subscription, free, tve = with a TV login, rent, buy
  type: "sub" | "free" | "tve" | "rent" | "buy";
  region: string;
  web_url: string;
  format: string;
  price: number | null;
};

// Each call costs 2 credits (TMDB-format id), so results are cached for a day
export async function getWatchSources(tmdbId: string, region = "US") {
  "use cache";
  cacheLife("days");

  const url = new URL(`${WATCHMODE_BASE_URL}/title/movie-${tmdbId}/sources/`);
  url.searchParams.set("apiKey", process.env.WHERE_TO_WATCH_API_KEY!);
  url.searchParams.set("regions", region);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Watchmode request failed: ${res.status}`);

  const sources: WatchSource[] = await res.json();

  // Watchmode lists each service once per format (SD/HD/4K), keep one per service and type
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.source_id}-${source.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

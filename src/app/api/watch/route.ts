import { getMovie } from "@lib/tmdb";
import { getWatchSources } from "@lib/watchmode";

// Repeat lookups for the same movie are answered by CloudFront for a day, not Watchmode
const CACHE_HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=86400" };

// GET /api/watch?id=<tmdb movie id>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ error: "Missing or invalid movie id" }, { status: 400 });
  }

  // Only spend a Watchmode call on a real movie, so nobody can burn the monthly quota
  // by looping through made-up ids. getMovie is cached, and TMDB answers 404 for unknown ids
  const movie = await getMovie(id).catch(() => null);
  if (!movie) {
    return Response.json({ error: "Unknown movie" }, { status: 404 });
  }

  try {
    return Response.json(await getWatchSources(id), { headers: CACHE_HEADERS });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import { MovieDb } from "moviedb-promise";
import { cacheLife } from "next/cache";

const HORROR_GENRE_ID = "27";

const moviedb = new MovieDb(process.env.TMDB_API_KEY!);

export async function getHorrorMovies(page = 1) {
  "use cache";
  cacheLife("days");

  const res = await moviedb.discoverMovie({
    with_genres: HORROR_GENRE_ID,
    sort_by: "title.asc",
    // Skip obscure entries with almost no votes
    "vote_count.gte": 200,
    page,
  });

  return res.results ?? [];
}

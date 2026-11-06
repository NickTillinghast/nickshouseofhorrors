import { MovieDb } from "moviedb-promise";
import { cacheLife } from "next/cache";

const HORROR_GENRE_ID = "27";

const moviedb = new MovieDb(process.env.TMDB_API_KEY!);

// TMDB always returns 20 movies per page. Subgenres are TMDB keyword ids (see data/horrorFilters.json)
export async function getHorrorMovies(page = 1, subgenreId?: number) {
  "use cache";
  cacheLife("days");

  const res = await moviedb.discoverMovie({
    with_genres: HORROR_GENRE_ID,
    with_keywords: subgenreId?.toString(),
    sort_by: "original_title.asc",
    // Skip obscure entries with almost no votes
    "vote_count.gte": 200,
    page,
  });

  return { movies: res.results ?? [], totalPages: res.total_pages ?? 1 };
}

// Full details for one movie (runtime, genres, tagline) for its own page
export async function getMovie(id: string) {
  "use cache";
  cacheLife("days");

  return moviedb.movieInfo({ id });
}

// TMDB's /movie/top_rated can't filter by genre, so sort a horror discover by rating instead
export async function getTopRatedHorrorMovies(count = 3, subgenreId?: number) {
  "use cache";
  cacheLife("days");

  const res = await moviedb.discoverMovie({
    with_genres: HORROR_GENRE_ID,
    with_keywords: subgenreId?.toString(),
    sort_by: "vote_average.desc",
    // A high bar so a handful of perfect scores can't top the list
    "vote_count.gte": 1000,
  });

  return (res.results ?? []).slice(0, count);
}

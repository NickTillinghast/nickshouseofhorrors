import { MovieDb } from "moviedb-promise";
import { cacheLife } from "next/cache";
import horrorFilters from "@data/horrorFilters.json";

const HORROR_GENRE_ID = "27";

const moviedb = new MovieDb(process.env.TMDB_API_KEY!);

// Most subgenres are TMDB keywords. A few (Horror Comedy) are better as a second genre,
// because TMDB rarely uses their keyword: horror AND comedy finds hundreds, the keyword finds one
function subgenreFilters(subgenreId?: number) {
  const subgenre = horrorFilters.subgenres.find((s) => s.id === subgenreId) as
    { id: number; genreId?: number } | undefined;
  if (subgenre?.genreId) {
    return { with_genres: `${HORROR_GENRE_ID},${subgenre.genreId}` };
  }
  return { with_genres: HORROR_GENRE_ID, with_keywords: subgenreId?.toString() };
}

// Skip obscure entries with almost no votes
export const DEFAULT_MIN_VOTES = 200;

// TMDB always returns 20 movies per page. Subgenres come from data/horrorFilters.json
export async function getHorrorMovies(page = 1, subgenreId?: number, minVotes = DEFAULT_MIN_VOTES) {
  "use cache";
  cacheLife("days");

  const res = await moviedb.discoverMovie({
    ...subgenreFilters(subgenreId),
    sort_by: "original_title.asc",
    "vote_count.gte": minVotes,
    page,
  });

  return {
    movies: res.results ?? [],
    totalPages: res.total_pages ?? 1,
    totalResults: res.total_results ?? 0,
  };
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
    ...subgenreFilters(subgenreId),
    sort_by: "vote_average.desc",
    // A high bar so a handful of perfect scores can't top the list
    "vote_count.gte": 1000,
  });

  return (res.results ?? []).slice(0, count);
}

// What people are watching right now, TMDB's popularity changes daily
export async function getPopularHorrorMovies(count = 50) {
  "use cache";
  cacheLife("hours");

  const pages = Math.ceil(count / 20);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      moviedb.discoverMovie({
        with_genres: HORROR_GENRE_ID,
        sort_by: "popularity.desc",
        // Keep out brand-new titles nobody has rated yet
        "vote_count.gte": 50,
        page: i + 1,
      }),
    ),
  );

  const seen = new Set<number>();
  return results
    .flatMap((res) => res.results ?? [])
    .filter((movie) => movie.id !== undefined && !seen.has(movie.id) && seen.add(movie.id))
    .slice(0, count);
}

// Title search, horror only. TMDB's search can't filter by genre, so drop the rest ourselves.
// Cached per query, so the same search costs one TMDB call per day at most
export async function searchHorrorMovies(query: string, pages = 1) {
  "use cache";
  cacheLife("days");

  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      moviedb.searchMovie({ query, page: i + 1, include_adult: false }),
    ),
  );

  const seen = new Set<number>();
  return results
    .flatMap((res) => res.results ?? [])
    .filter(
      (movie) =>
        movie.id !== undefined &&
        movie.genre_ids?.includes(Number(HORROR_GENRE_ID)) &&
        !seen.has(movie.id) &&
        seen.add(movie.id),
    );
}

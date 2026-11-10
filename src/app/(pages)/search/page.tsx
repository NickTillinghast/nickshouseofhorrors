import { Suspense } from "react";
import type { Metadata } from "next";
import MovieDetailCard from "@components/MovieDetailCard/MovieDetailCard";
import { searchHorrorMovies } from "@lib/tmdb";
import movieStyles from "../movies/page.module.css";

export const metadata: Metadata = {
  title: "Search",
  // Search results pages shouldn't show up in Google
  robots: { index: false },
};

// The full page digs a little deeper than the navbar dropdown
const RESULT_PAGES = 3;

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className={movieStyles.page}>
      {/* Reading the URL happens at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p>Searching the crypt…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);

  // Same rule as the navbar box: 3 characters or fewer never searches
  if (query.length < 4) {
    return (
      <>
        <h1>Search</h1>
        <p>
          Type at least 4 characters of a movie title in the search box at the top (or press /).
        </p>
      </>
    );
  }

  const movies = await searchHorrorMovies(query.toLowerCase(), RESULT_PAGES);

  return (
    <>
      <h1>
        {movies.length} horror {movies.length === 1 ? "movie" : "movies"} for “{query}”
      </h1>
      {movies.length === 0 ? (
        <p>Nothing crawled out. Try another title.</p>
      ) : (
        <div className={movieStyles.grid}>
          {movies.map((movie) => (
            <MovieDetailCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { getHorrorMovies, getTopRatedHorrorMovies } from "../../../lib/tmdb";
import horrorFilters from "../../../data/horrorFilters.json";
import MovieFeed from "./MovieFeed";
import SubgenreFilter from "./SubgenreFilter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Horror Movies A–Z by Subgenre",
  description:
    "Browse horror movies from slashers and zombies to folk horror and found footage. Filter by subgenre and find out where to stream each one.",
};

// TMDB pages hold 20 movies, so start with the first two pages
const INITIAL_PAGES = 2;
const TOP_RATED_COUNT = 3;

type MoviesPageProps = {
  searchParams: Promise<{ subgenre?: string }>;
};

export default function MoviesPage({ searchParams }: MoviesPageProps) {
  return (
    <main className={styles.page}>
      <h1>Horror Movies</h1>

      {/* Reading the URL happens at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p>Loading movies…</p>}>
        <Movies searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Movies({ searchParams }: MoviesPageProps) {
  const { subgenre } = await searchParams;
  // Only accept subgenres from our list, anything else shows all horror
  const subgenreId = horrorFilters.subgenres.find((s) => s.id === Number(subgenre))?.id;

  const [topRated, ...pages] = await Promise.all([
    getTopRatedHorrorMovies(TOP_RATED_COUNT, subgenreId),
    ...Array.from({ length: INITIAL_PAGES }, (_, i) => getHorrorMovies(i + 1, subgenreId)),
  ]);

  return (
    <>
      <SubgenreFilter selectedId={subgenreId} />

      <MovieFeed
        // A new subgenre starts a fresh feed instead of keeping the old Load more state
        key={subgenreId ?? "all"}
        topRated={topRated}
        initialMovies={pages.flatMap((page) => page.movies)}
        nextPage={INITIAL_PAGES + 1}
        totalPages={pages[0].totalPages}
        subgenreId={subgenreId}
      />
    </>
  );
}

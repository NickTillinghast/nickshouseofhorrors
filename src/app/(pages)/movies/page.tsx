import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getHorrorMovies, getTopRatedHorrorMovies } from "@lib/tmdb";
import {
  SUBGENRES,
  findSubgenre,
  subgenreDescription,
  subgenreHeading,
  subgenreHref,
  subgenreTitle,
} from "@lib/subgenres";
import MovieFeed from "./MovieFeed";
import SubgenreFilter from "./SubgenreFilter";
import styles from "./page.module.css";

// Each subgenre gets its own title, description and canonical address, so
// "/movies?subgenre=12339" can show up in Google as "Best Slasher Movies & Where to Stream Them"
export async function generateMetadata({ searchParams }: MoviesPageProps): Promise<Metadata> {
  const subgenre = findSubgenre((await searchParams).subgenre);
  if (!subgenre) {
    return {
      title: "Horror Movies A–Z by Subgenre",
      description:
        "Browse horror movies from slashers and zombies to folk horror and found footage. Filter by subgenre and find out where to stream each one.",
      alternates: { canonical: "/movies" },
    };
  }
  return {
    title: subgenreTitle(subgenre),
    description: subgenreDescription(subgenre),
    alternates: { canonical: subgenreHref(subgenre) },
    openGraph: { title: subgenreTitle(subgenre), description: subgenreDescription(subgenre) },
  };
}

// TMDB pages hold 20 movies, so start with the first two pages
const INITIAL_PAGES = 2;
const TOP_RATED_COUNT = 3;

type MoviesPageProps = {
  searchParams: Promise<{ subgenre?: string }>;
};

export default function MoviesPage({ searchParams }: MoviesPageProps) {
  return (
    <main className={styles.page}>
      {/* Reading the URL happens at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p>Loading movies…</p>}>
        <Movies searchParams={searchParams} />
      </Suspense>

      {/* Plain links Google can follow to every subgenre page (the dropdown above is JavaScript) */}
      <nav className={styles.subgenreLinks} aria-labelledby="subgenre-links">
        <h2 id="subgenre-links" className={styles.subgenreLinksTitle}>
          Browse horror by subgenre
        </h2>
        <ul>
          {SUBGENRES.map((subgenre) => (
            <li key={subgenre.id}>
              <Link href={subgenreHref(subgenre)} prefetch={false}>
                {subgenre.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

async function Movies({ searchParams }: MoviesPageProps) {
  const subgenre = findSubgenre((await searchParams).subgenre);
  const subgenreId = subgenre?.id;

  const [topRated, ...pages] = await Promise.all([
    getTopRatedHorrorMovies(TOP_RATED_COUNT, subgenreId),
    ...Array.from({ length: INITIAL_PAGES }, (_, i) => getHorrorMovies(i + 1, subgenreId)),
  ]);

  return (
    <>
      <h1>{subgenre ? subgenreHeading(subgenre) : "Horror Movies"}</h1>
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

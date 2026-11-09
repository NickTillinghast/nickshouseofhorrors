import type { Metadata } from "next";
import { Creepster } from "next/font/google";
import MovieList from "../../../components/MovieList/MovieList";
import { FEATURED_LISTS } from "../../../data/lists";
import { SOCIAL_LINKS } from "../../../lib/navigation";
import { getMovie } from "../../../lib/tmdb";
import styles from "./page.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Lists: Fans' Favorite Horror Movies",
  description: "Favorite horror movie lists sent in by fans of Nicks House of Horrors.",
  alternates: { canonical: "/lists" },
  // TODO: allow indexing (and add /lists to the sitemap) once the lists have movies in them
  robots: { index: false },
};

const instagram = SOCIAL_LINKS.find((link) => link.label === "Instagram")?.href;

export default async function ListsPage() {
  // Each movie comes from the cached TMDB details, so filling a list costs nothing per visit
  const lists = await Promise.all(
    FEATURED_LISTS.map(async (list) => ({
      ...list,
      movies: await Promise.all(list.movieIds.map((id) => getMovie(String(id)))),
    })),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={`${styles.title} ${creepster.className}`}>The Lists</h1>
        <p className={styles.intro}>
          Favorite horror movies, picked by fans. Want your list featured? Send us your top picks
          {instagram ? (
            <>
              {" "}
              on{" "}
              <a href={instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </>
          ) : null}
          .
        </p>
      </header>

      <div className={styles.grid}>
        {lists.map((list) => (
          <MovieList
            key={list.title}
            title={list.title}
            description={list.curator ? `Picked by ${list.curator}` : list.description}
            movies={list.movies}
            redBottom
            emptyText="This spot is waiting for a victim. Yours could be next."
          />
        ))}
      </div>
    </main>
  );
}

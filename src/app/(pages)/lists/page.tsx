import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Creepster } from "next/font/google";
import MovieList from "@components/MovieList/MovieList";
import horrorFilters from "@data/horrorFilters.json";
import {
  formatDate,
  formatPrice,
  FIRST_LIST_PRICE_CENTS,
  getFeaturedList,
  getPromotedLists,
  getPublishedLists,
  type UserList,
} from "@lib/userLists";
import SubgenreFilter from "../movies/SubgenreFilter";
import styles from "./page.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Lists: Fans' Top 10 Horror Movies",
  description:
    "Top 10 horror movie lists from Nick and fans of Nicks House of Horrors. Filter by subgenre or make your own.",
  alternates: { canonical: "/lists" },
};

const GENRE_NAMES = new Map(horrorFilters.subgenres.map((genre) => [genre.id, genre.name]));
// Promoted spots after yours at the top of the page
const PROMOTED_SPOTS = 2;

function describe(list: UserList) {
  const genres = list.genreIds.map((id) => GENRE_NAMES.get(id)).filter(Boolean);
  return [`Picked by ${list.username}`, ...genres].join(" · ");
}

export default function ListsPage(props: PageProps<"/lists">) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={`${styles.title} ${creepster.className}`}>The Lists</h1>
        <p className={styles.intro}>
          Top 10 horror movies, picked by Nick and by fans. Make your own Top 10 and it&apos;s
          promoted at the top of this page for 2 weeks.
        </p>
        <div className={styles.headerLinks}>
          <Link href="/lists/new/checkout" className={styles.create}>
            Create your Top 10 · {formatPrice(FIRST_LIST_PRICE_CENTS)}
          </Link>
          <Link href="/lists/mine" className={styles.mine}>
            My lists
          </Link>
        </div>
      </header>

      <Suspense fallback={<p className={styles.loading}>Loading lists…</p>}>
        <Lists searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Lists({ searchParams }: Pick<PageProps<"/lists">, "searchParams">) {
  const { genre } = await searchParams;
  // Only accept genres from our list, anything else shows every list
  const genreId = horrorFilters.subgenres.find((g) => g.id === Number(genre))?.id;

  const [featured, promoted, newest, filtered] = await Promise.all([
    getFeaturedList(),
    getPromotedLists(),
    getPublishedLists(),
    genreId ? getPublishedLists(genreId) : null,
  ]);

  // Empty promoted spots go to the newest lists, so the top row is never blank
  const promotedIds = new Set(promoted.map((list) => list.id));
  const fillers = newest.filter((list) => !promotedIds.has(list.id));
  const spots = [
    ...promoted.map((list) => ({
      list,
      badge: "Promoted",
      note: `Promoted until ${formatDate(list.promotedUntil)}`,
    })),
    ...fillers.map((list) => ({ list, badge: "New", note: undefined })),
  ].slice(0, PROMOTED_SPOTS);

  const grid = filtered ?? newest;

  return (
    <>
      <section className={styles.topRow} aria-label="Featured lists">
        {featured ? (
          <MovieList
            title={featured.title}
            titleHref={`/lists/${featured.id}`}
            description="Nick's all-time Top 10"
            badge="Nick's pick"
            movies={featured.movies}
            redBottom
          />
        ) : (
          <MovieList
            title="Nick's Top 10"
            description="Nick's all-time Top 10"
            badge="Nick's pick"
            movies={[]}
            redBottom
            emptyText="Coming soon. Nick is still arguing with himself about number 1."
          />
        )}
        {spots.map(({ list, badge, note }) => (
          <MovieList
            key={list.id}
            title={list.title}
            titleHref={`/lists/${list.id}`}
            description={note ? `${describe(list)} · ${note}` : describe(list)}
            badge={badge}
            movies={list.movies}
            redBottom
          />
        ))}
        {Array.from({ length: PROMOTED_SPOTS - spots.length }, (_, i) => (
          <MovieList
            key={`open-${i}`}
            title="This spot is open"
            description="Promoted fan list"
            badge="Promoted"
            movies={[]}
            redBottom
            emptyText="This spot is waiting for a victim. Create your Top 10 and it could be yours."
          />
        ))}
      </section>

      <section className={styles.allLists} aria-labelledby="all-lists">
        <div className={styles.allHeader}>
          <h2 id="all-lists" className={styles.sectionTitle}>
            All lists
          </h2>
          <SubgenreFilter selectedId={genreId} path="/lists" param="genre" label="Genre" />
        </div>

        {grid.length === 0 ? (
          <p className={styles.loading}>
            {genreId
              ? `No ${GENRE_NAMES.get(genreId)} lists yet. Be the first.`
              : "No fan lists yet. Be the first."}
          </p>
        ) : (
          <div className={styles.grid}>
            {grid.map((list) => (
              <MovieList
                key={list.id}
                title={list.title}
                titleHref={`/lists/${list.id}`}
                description={describe(list)}
                movies={list.movies}
                redBottom
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MovieList from "@components/MovieList/MovieList";
import horrorFilters from "@data/horrorFilters.json";
import { formatDate, getList } from "@lib/userLists";
import styles from "../lists.module.css";

const GENRE_NAMES = new Map(horrorFilters.subgenres.map((genre) => [genre.id, genre.name]));

async function loadList(params: PageProps<"/lists/[id]">["params"]) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return null;
  return getList(Number(id));
}

export async function generateMetadata(props: PageProps<"/lists/[id]">): Promise<Metadata> {
  const list = await loadList(props.params);
  if (!list) return { title: "List not found" };

  const title = `${list.title}: ${list.username}'s Top 10 Horror Movies`;
  const description = list.movies
    .slice(0, 5)
    .map((movie, i) => `${i + 1}. ${movie.title}`)
    .join(", ");
  const poster = list.movies[0]?.poster_path;
  const images = poster ? [{ url: `https://image.tmdb.org/t/p/w780${poster}` }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/lists/${list.id}` },
    openGraph: { title, description, images },
    twitter: { title, description, images },
  };
}

export default function ListPage(props: PageProps<"/lists/[id]">) {
  return (
    <main className={styles.narrowPage}>
      {/* The id comes from the URL at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p className={styles.muted}>Loading list…</p>}>
        <List params={props.params} />
      </Suspense>
    </main>
  );
}

async function List({ params }: Pick<PageProps<"/lists/[id]">, "params">) {
  const list = await loadList(params);
  if (!list) notFound();

  const genres = list.genreIds.map((id) => GENRE_NAMES.get(id)).filter(Boolean);

  return (
    <>
      <Link href="/lists" className={styles.back}>
        ← The Lists
      </Link>
      <div className={styles.listMeta}>
        {list.promotedUntil && (
          <span className={styles.promoted}>Promoted until {formatDate(list.promotedUntil)}</span>
        )}
        {genres.map((genre) => (
          <span key={genre} className={styles.chip}>
            {genre}
          </span>
        ))}
      </div>
      <MovieList
        title={list.title}
        description={`Picked by ${list.username}${
          list.publishedAt ? ` · ${formatDate(list.publishedAt)}` : ""
        }`}
        movies={list.movies}
        redBottom
      />
    </>
  );
}

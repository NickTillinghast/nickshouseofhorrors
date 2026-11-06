import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getMovie } from "../../../../lib/tmdb";
import MovieDetails from "./MovieDetails";
import styles from "../page.module.css";

export default function MovieDetailPage(props: PageProps<"/movies/[id]">) {
  return (
    <main className={styles.page}>
      {/* The id comes from the URL at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p>Loading movie…</p>}>
        <Movie params={props.params} />
      </Suspense>
    </main>
  );
}

async function Movie({ params }: Pick<PageProps<"/movies/[id]">, "params">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  // TMDB answers 404 for ids it doesn't know
  const movie = await getMovie(id).catch(() => null);
  if (!movie) notFound();

  return <MovieDetails movie={movie} />;
}

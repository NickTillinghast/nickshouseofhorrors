import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { MovieResponse } from "moviedb-promise";
import { getMovie } from "../../../../lib/tmdb";
import { SITE_URL } from "../../../../lib/site";
import MovieDetails from "./MovieDetails";
import styles from "../page.module.css";

const POSTER_URL = "https://image.tmdb.org/t/p/w780";
const DESCRIPTION_LENGTH = 155;

// Shared by the page and its metadata. getMovie is cached, so this only hits TMDB once
async function loadMovie(params: PageProps<"/movies/[id]">["params"]) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return null;
  // TMDB answers 404 for ids it doesn't know
  return getMovie(id).catch(() => null);
}

function describe(movie: MovieResponse) {
  const overview = movie.overview ?? "";
  if (overview.length <= DESCRIPTION_LENGTH) return overview;
  return `${overview.slice(0, overview.lastIndexOf(" ", DESCRIPTION_LENGTH))}…`;
}

// "The Shining (1980) | Nicks House of Horrors" in search results and share previews
export async function generateMetadata(props: PageProps<"/movies/[id]">): Promise<Metadata> {
  const movie = await loadMovie(props.params);
  if (!movie) return { title: "Movie not found" };

  const year = movie.release_date?.slice(0, 4);
  const title = year ? `${movie.title} (${year})` : (movie.title ?? "Horror movie");
  const description =
    describe(movie) || `Where to watch ${movie.title} and what horror fans think of it.`;
  const images = movie.poster_path
    ? [{ url: `${POSTER_URL}${movie.poster_path}`, alt: `${movie.title} poster` }]
    : undefined;

  return {
    title: `${title}: Where to Watch`,
    description,
    alternates: { canonical: `/movies/${movie.id}` },
    openGraph: { title, description, type: "video.movie", images },
    twitter: { title, description, images },
  };
}

// Structured data Google can read for rich results (poster, rating, release date)
function movieJsonLd(movie: MovieResponse) {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url: `${SITE_URL}/movies/${movie.id}`,
    image: movie.poster_path ? `${POSTER_URL}${movie.poster_path}` : undefined,
    description: movie.overview || undefined,
    datePublished: movie.release_date || undefined,
    genre: movie.genres?.map((genre) => genre.name),
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    aggregateRating:
      movie.vote_count && movie.vote_average
        ? {
            "@type": "AggregateRating",
            ratingValue: movie.vote_average.toFixed(1),
            bestRating: "10",
            ratingCount: movie.vote_count,
          }
        : undefined,
  };
}

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
  const movie = await loadMovie(params);
  if (!movie) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so text from TMDB can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(movieJsonLd(movie)).replace(/</g, "\\u003c"),
        }}
      />
      <MovieDetails movie={movie} />
    </>
  );
}

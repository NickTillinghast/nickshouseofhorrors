import MovieDetailCard from "../../../components/MovieDetailCard/MovieDetailCard";
import { getHorrorMovies } from "../../../lib/tmdb";
import styles from "./page.module.css";

export default async function MoviesPage() {
  const movies = await getHorrorMovies();

  return (
    <main className={styles.page}>
      <h1>Horror Movies</h1>

      <div className={styles.grid}>
        {movies.map((movie) => (
          <MovieDetailCard key={movie.id} movie={movie} />
        ))}
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { MY_MOVIES_LABEL } from "@lib/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import MovieDetailCard from "@components/MovieDetailCard/MovieDetailCard";
import { createClient } from "@lib/supabase/server";
import movieStyles from "../movies/page.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: MY_MOVIES_LABEL,
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <main className={movieStyles.page}>
      {/* Reads the login cookie at request time, so it sits inside Suspense */}
      <Suspense fallback={<p>Loading your hearts…</p>}>
        <Profile />
      </Suspense>
    </main>
  );
}

async function Profile() {
  // Supabase checks the session expiry with Date.now(), so wait for a real request first
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  // Row Level Security already limits this to the signed-in user's rows
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("tmdb_id, title, poster_path, release_date, overview, vote_average")
    .order("created_at", { ascending: false });

  const name = user.user_metadata.full_name ?? user.email ?? "You";
  const avatarUrl: string | undefined = user.user_metadata.avatar_url;
  const count = favorites?.length ?? 0;

  return (
    <>
      <header className={styles.header}>
        {avatarUrl ? (
          <Image className={styles.avatar} src={avatarUrl} alt="" width={64} height={64} />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {name[0].toUpperCase()}
          </span>
        )}
        <div>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.count}>
            {count} hearted {count === 1 ? "movie" : "movies"}
          </p>
        </div>
      </header>

      {error && <p className={styles.empty}>Couldn&apos;t load your hearts. Please refresh.</p>}

      {!error && count === 0 && (
        <p className={styles.empty}>
          No hearts yet. Browse the <Link href="/movies">movies</Link> and tap the heart on any you
          love.
        </p>
      )}

      {count > 0 && (
        <div className={movieStyles.grid}>
          {favorites!.map((favorite) => (
            <MovieDetailCard
              key={favorite.tmdb_id}
              movie={{
                id: favorite.tmdb_id,
                title: favorite.title,
                poster_path: favorite.poster_path ?? undefined,
                release_date: favorite.release_date ?? undefined,
                overview: favorite.overview ?? undefined,
                vote_average: favorite.vote_average ?? undefined,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import { useFavorites } from "@components/Favorites/FavoritesProvider";
import { toFavoriteMovie, type FavoriteSource } from "@lib/favorites";
import styles from "./FavoriteButton.module.css";

type FavoriteButtonProps = {
  movie: FavoriteSource;
};

export default function FavoriteButton({ movie }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(movie.id);

  function onClick() {
    const favorite = toFavoriteMovie(movie);
    if (favorite) toggle(favorite);
  }

  return (
    <button
      type="button"
      className={`${styles.favHeart} ${saved ? styles.saved : ""}`}
      onClick={onClick}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${movie.title} from favorites` : `Save ${movie.title} to favorites`
      }
      title={saved ? "Remove from favorites" : "Save to favorites"}
    >
      <Image src="/assets/anatomical-heart-svgrepo-com.svg" alt="" width={30} height={30} />
    </button>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./FavoriteButton.module.css";

type FavoriteButtonProps = {
  movieTitle?: string;
};

export default function FavoriteButton({ movieTitle }: FavoriteButtonProps) {
  // TODO: load and save this from the user's profile once accounts exist
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      className={`${styles.favHeart} ${saved ? styles.saved : ""}`}
      onClick={() => setSaved(!saved)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${movieTitle} from favorites` : `Save ${movieTitle} to favorites`}
      title={saved ? "Remove from favorites" : "Save to favorites"}
    >
      <Image src="/assets/anatomical-heart-svgrepo-com.svg" alt="" width={30} height={30} />
    </button>
  );
}

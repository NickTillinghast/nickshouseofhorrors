"use client";

import Link from "next/link";
import { useFavorites } from "@components/Favorites/FavoritesProvider";
import { MY_MOVIES_LABEL } from "@lib/navigation";
import styles from "./page.module.css";

// Signed out: invite them to sign in. Signed in: take them to their hearts
export default function HeartsCta() {
  const { user } = useFavorites();

  return user ? (
    <Link href="/profile" className={styles.primaryButton}>
      Go to {MY_MOVIES_LABEL}
    </Link>
  ) : (
    <Link href="/login?next=/movies" className={styles.primaryButton}>
      Sign in to start hearting
    </Link>
  );
}

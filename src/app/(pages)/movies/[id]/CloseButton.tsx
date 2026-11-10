"use client";

import { useRouter } from "next/navigation";
import modalStyles from "@components/MovieDetailCard/MovieModal.module.css";

// The ✕ on a movie's own page. Goes back to where you came from on this site,
// or to the movie list when the page was opened directly (a shared link, a search result)
export default function CloseButton() {
  const router = useRouter();

  function close() {
    const cameFromHere = document.referrer.startsWith(window.location.origin);
    if (cameFromHere && window.history.length > 1) router.back();
    else router.push("/movies");
  }

  return (
    <button type="button" className={modalStyles.close} onClick={close} aria-label="Close">
      ✕
    </button>
  );
}

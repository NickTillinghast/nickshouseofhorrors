"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@lib/supabase/client";
import type { FavoriteMovie } from "@lib/favorites";
import { addFavorite, removeFavorite } from "@app/(pages)/profile/actions";
import SignInDialog from "@components/Auth/SignInDialog";

type FavoritesContextValue = {
  user: User | null;
  isFavorite: (tmdbId?: number) => boolean;
  toggle: (movie: FavoriteMovie) => void;
  // Opens the sign-in dialog and comes back to this page afterwards
  openSignIn: () => void;
  signOut: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Loaded in the browser so movie pages can stay cached for everyone
export default function FavoritesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Tagged with the user they belong to, so a sign-out never shows someone else's hearts
  const [favorites, setFavorites] = useState<{ userId: string; ids: Set<number> } | null>(null);
  const [signInNext, setSignInNext] = useState("/home");
  const signInRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    createClient()
      .from("favorites")
      .select("tmdb_id")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setFavorites({ userId, ids: new Set(data.map((row) => row.tmdb_id as number)) });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const ids = favorites && favorites.userId === userId ? favorites.ids : new Set<number>();

  function setHearted(tmdbId: number, hearted: boolean) {
    setFavorites((current) => {
      if (!userId) return current;
      const next = new Set(current?.userId === userId ? current.ids : []);
      if (hearted) next.add(tmdbId);
      else next.delete(tmdbId);
      return { userId, ids: next };
    });
  }

  function openSignIn() {
    setSignInNext(window.location.pathname + window.location.search);
    signInRef.current?.showModal();
  }

  async function toggle(movie: FavoriteMovie) {
    if (!user) {
      openSignIn();
      return;
    }

    // Update the heart right away, then undo it if saving fails
    const hearted = !ids.has(movie.id);
    setHearted(movie.id, hearted);
    try {
      if (hearted) await addFavorite(movie);
      else await removeFavorite(movie.id);
    } catch {
      setHearted(movie.id, !hearted);
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/home");
    // Drop any server-rendered pages that were made for the signed-in user
    router.refresh();
  }

  return (
    <FavoritesContext
      value={{
        user,
        isFavorite: (tmdbId) => tmdbId !== undefined && ids.has(tmdbId),
        toggle,
        openSignIn,
        signOut,
      }}
    >
      {children}
      <SignInDialog ref={signInRef} next={signInNext} />
    </FavoritesContext>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}

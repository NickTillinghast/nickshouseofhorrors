"use client";

import { useState } from "react";
import type { WatchSource } from "../lib/watchmode";

export type WatchState = ReturnType<typeof useWatchSources>;

// Only call load() from a click, since every lookup spends Watchmode credits
export default function useWatchSources(tmdbId?: number) {
  const [sources, setSources] = useState<WatchSource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    if (tmdbId === undefined || sources || loading) return;

    setLoading(true);
    setError(false);
    const res = await fetch(`/api/watch?id=${tmdbId}`);
    if (res.ok) setSources(await res.json());
    else setError(true);
    setLoading(false);
  }

  return { sources, loading, error, load };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { quickSearch } from "../app/(pages)/search/actions";

// Wait for the user to stop typing this long before searching, so a whole word is one call
const PAUSE_MS = 700;
// 3 characters or fewer never searches
export const SEARCH_MIN_CHARS = 4;

export type SearchResult = Awaited<ReturnType<typeof quickSearch>>[number];

// Horror movie search as you type, used by the navbar search and the list builder
export function useMovieSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  // Each search gets a number; answers for anything but the latest one are ignored
  const latestSearch = useRef(0);

  const trimmed = query.trim();

  // Search once typing pauses
  useEffect(() => {
    if (trimmed.length < SEARCH_MIN_CHARS) return;
    const searchId = ++latestSearch.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      const movies = await quickSearch(trimmed).catch(() => []);
      if (searchId !== latestSearch.current) return;
      setResults(movies);
      setLoading(false);
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim().length < SEARCH_MIN_CHARS) {
      // Too short to search: cancel anything in flight and clear the list
      latestSearch.current++;
      setResults(null);
      setLoading(false);
    }
  }

  return { query, trimmed, results, loading, changeQuery };
}

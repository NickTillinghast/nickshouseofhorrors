"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createClient } from "../lib/supabase/client";

// Comment counts shared by every bubble on the page, so posting in the modal updates the card too
const counts = new Map<string, number>();
const listeners = new Set<() => void>();
const requested = new Set<string>();
let queue: string[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCommentCount(thread: string, count: number) {
  counts.set(thread, count);
  listeners.forEach((listener) => listener());
}

// Cards ask one at a time, so gather every thread asked for in the same tick into one query
function requestCount(thread: string) {
  if (requested.has(thread)) return;
  requested.add(thread);
  queue.push(thread);
  if (queue.length > 1) return;

  queueMicrotask(async () => {
    const threads = queue;
    queue = [];
    const { data } = await createClient().from("comments").select("thread").in("thread", threads);
    if (!data) {
      threads.forEach((t) => requested.delete(t));
      return;
    }
    const totals = new Map(threads.map((t) => [t, 0]));
    data.forEach((row) => totals.set(row.thread, (totals.get(row.thread) ?? 0) + 1));
    totals.forEach((count, t) => counts.set(t, count));
    listeners.forEach((listener) => listener());
  });
}

// Undefined until the count has loaded
export default function useCommentCount(thread: string) {
  useEffect(() => requestCount(thread), [thread]);
  return useSyncExternalStore(
    subscribe,
    () => counts.get(thread),
    () => undefined,
  );
}

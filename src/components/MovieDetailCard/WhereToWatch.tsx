"use client";

import type { WatchSource } from "../../lib/watchmode";
import type { WatchState } from "../../hooks/useWatchSources";
import styles from "./WhereToWatch.module.css";

const TYPE_LABELS: Record<WatchSource["type"], string> = {
  sub: "Stream",
  free: "Free",
  tve: "With TV provider",
  rent: "Rent",
  buy: "Buy",
};

export default function WhereToWatch({ sources, loading, error, load }: WatchState) {
  if (!sources) {
    return (
      <div>
        <button type="button" className={styles.button} onClick={load} disabled={loading}>
          {loading ? "Looking…" : "How to watch"}
        </button>
        {error && <p className={styles.message}>Couldn&apos;t load where to watch. Try again.</p>}
      </div>
    );
  }

  if (sources.length === 0) {
    return <p className={styles.message}>Not available to stream, rent or buy right now.</p>;
  }

  return (
    <ul className={styles.sources}>
      {sources.map((source) => (
        <li key={`${source.source_id}-${source.type}`}>
          <a href={source.web_url} target="_blank" rel="noopener noreferrer">
            {source.name}
            <span className={styles.type}>
              {TYPE_LABELS[source.type]}
              {source.price ? ` $${source.price.toFixed(2)}` : ""}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

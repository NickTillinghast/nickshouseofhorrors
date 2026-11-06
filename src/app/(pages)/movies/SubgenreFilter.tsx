"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import horrorFilters from "../../../data/horrorFilters.json";
import styles from "./page.module.css";

const SUBGENRES = [...horrorFilters.subgenres].sort((a, b) => a.name.localeCompare(b.name));

type SubgenreFilterProps = {
  selectedId?: number;
};

export default function SubgenreFilter({ selectedId }: SubgenreFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The choice lives in the URL (?subgenre=12339) so a filtered page can be shared or bookmarked
  function select(id: string) {
    startTransition(() => {
      router.push(id ? `/movies?subgenre=${id}` : "/movies");
    });
  }

  return (
    <div className={styles.filter}>
      <label htmlFor="subgenre">Filter</label>
      <select
        id="subgenre"
        className={styles.select}
        value={selectedId ?? ""}
        onChange={(e) => select(e.target.value)}
        disabled={isPending}
      >
        <option value="">All horror</option>
        {SUBGENRES.map((subgenre) => (
          <option key={subgenre.id} value={subgenre.id}>
            {subgenre.name}
          </option>
        ))}
      </select>
      {isPending && <span className={styles.pending}>Loading…</span>}
    </div>
  );
}

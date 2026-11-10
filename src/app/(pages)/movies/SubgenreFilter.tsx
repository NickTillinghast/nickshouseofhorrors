"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import GenreSelect from "@components/GenreSelect/GenreSelect";
import styles from "./page.module.css";

type SubgenreFilterProps = {
  selectedId?: number;
  // Reused on /lists, which filters with ?genre= instead
  path?: string;
  param?: string;
  label?: string;
};

export default function SubgenreFilter({
  selectedId,
  path = "/movies",
  param = "subgenre",
  label = "Filter",
}: SubgenreFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The choice lives in the URL (e.g. ?subgenre=12339) so a filtered page can be shared or bookmarked
  function select(id: number | undefined) {
    startTransition(() => {
      router.push(id ? `${path}?${param}=${id}` : path);
    });
  }

  return (
    <div className={styles.filter}>
      <GenreSelect label={label} value={selectedId} onChange={select} disabled={isPending} />
      {isPending && <span className={styles.pending}>Loading…</span>}
    </div>
  );
}

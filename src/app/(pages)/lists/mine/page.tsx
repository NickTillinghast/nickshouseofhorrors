import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, formatPrice, PROMOTE_PRICE_CENTS } from "@lib/userLists";
import { requireUser } from "../requireUser";
import styles from "../lists.module.css";

export const metadata: Metadata = {
  title: "My lists",
  robots: { index: false },
};

export default function MyListsPage() {
  return (
    <main className={styles.narrowPage}>
      <h1 className={styles.pageTitle}>My lists</h1>
      {/* Reads the login cookie at request time, so it sits inside Suspense */}
      <Suspense fallback={<p className={styles.muted}>Loading your lists…</p>}>
        <MyLists />
      </Suspense>
    </main>
  );
}

type MyListRow = {
  id: number;
  title: string | null;
  status: "draft" | "published" | "hidden";
  created_at: string;
  user_list_movies: { count: number }[];
  list_promotions: { starts_at: string; ends_at: string }[];
};

function promotionStatus(promotions: MyListRow["list_promotions"]) {
  const now = Date.now();
  const upcoming = promotions
    .filter((p) => new Date(p.ends_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  if (!upcoming.length) return null;
  const lastEnd = upcoming[upcoming.length - 1].ends_at;
  const first = upcoming[0];
  return new Date(first.starts_at).getTime() <= now
    ? `Promoted until ${formatDate(lastEnd)}`
    : `Promotion queued: ${formatDate(first.starts_at)} to ${formatDate(lastEnd)}`;
}

async function MyLists() {
  const { supabase, user } = await requireUser("/lists/mine");

  const { data } = await supabase
    .from("user_lists")
    .select(
      "id, title, status, created_at, user_list_movies(count), list_promotions(starts_at, ends_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .overrideTypes<MyListRow[], { merge: false }>();
  const lists = data ?? [];

  return (
    <>
      <Link href="/lists/new/checkout" className={styles.primaryLink}>
        Create a new Top 10
      </Link>

      {lists.length === 0 ? (
        <p className={styles.muted}>You haven&apos;t made a list yet.</p>
      ) : (
        <ul className={styles.myLists}>
          {lists.map((list) => {
            const count = list.user_list_movies[0]?.count ?? 0;
            const promo = promotionStatus(list.list_promotions);
            return (
              <li key={list.id} className={styles.myList}>
                <div className={styles.myListInfo}>
                  <span className={styles.movieTitle}>{list.title ?? "Untitled draft"}</span>
                  <span className={styles.muted}>
                    {list.status === "draft"
                      ? `Draft · ${count} / 10 movies`
                      : list.status === "hidden"
                        ? "Hidden by Nick"
                        : "Published"}
                    {promo ? ` · ${promo}` : ""}
                  </span>
                </div>
                <div className={styles.myListActions}>
                  {list.status === "draft" && (
                    <Link href={`/lists/${list.id}/edit`} className={styles.small}>
                      Continue editing
                    </Link>
                  )}
                  {list.status === "published" && (
                    <>
                      <Link href={`/lists/${list.id}`} className={styles.small}>
                        View
                      </Link>
                      <Link href={`/lists/${list.id}/promote`} className={styles.small}>
                        Promote 30 days · {formatPrice(PROMOTE_PRICE_CENTS)}
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

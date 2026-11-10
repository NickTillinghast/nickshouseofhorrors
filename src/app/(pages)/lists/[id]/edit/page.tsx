import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { previewPromotion } from "../../../../../lib/listPurchases";
import { formatDate, LIST_SELECT, toUserList, type ListRow } from "../../../../../lib/userLists";
import { requireUser } from "../../requireUser";
import ListBuilder from "./ListBuilder";
import styles from "../../lists.module.css";

export const metadata: Metadata = {
  title: "Build your Top 10",
  robots: { index: false },
};

export default function EditListPage(props: PageProps<"/lists/[id]/edit">) {
  return (
    <main className={styles.builderPage}>
      <h1 className={styles.pageTitle}>Build your Top 10</h1>
      {/* Reads the login cookie at request time, so it sits inside Suspense */}
      <Suspense fallback={<p className={styles.muted}>Loading your list…</p>}>
        <Editor params={props.params} />
      </Suspense>
    </main>
  );
}

async function Editor({ params }: Pick<PageProps<"/lists/[id]/edit">, "params">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { supabase, user } = await requireUser(`/lists/${id}/edit`);

  // Row Level Security only returns published lists or this user's own
  const { data } = await supabase
    .from("user_lists")
    .select(`${LIST_SELECT}, user_id, status, promo_days_owed`)
    .eq("id", Number(id))
    .maybeSingle()
    .overrideTypes<
      ListRow & { user_id: string; status: string; promo_days_owed: number },
      { merge: false }
    >();
  if (!data || data.user_id !== user.id) notFound();
  if (data.status !== "draft") redirect(`/lists/${id}`);

  const list = toUserList(data);
  let promoNote: string | null = null;
  if (data.promo_days_owed > 0) {
    const { startsAt, endsAt } = await previewPromotion(list.id, data.promo_days_owed);
    promoNote = `Comes with ${data.promo_days_owed} days promoted, about ${formatDate(startsAt)} to ${formatDate(endsAt)}.`;
  }

  return (
    <ListBuilder
      listId={list.id}
      initial={{ title: data.title ?? "", genreIds: list.genreIds, movies: list.movies }}
      promoNote={promoNote}
    />
  );
}

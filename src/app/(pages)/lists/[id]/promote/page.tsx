import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { previewPromotion, PROMOTE_OFFER } from "@lib/listPurchases";
import { formatDate, formatPrice } from "@lib/userLists";
import { promoteList } from "../../actions";
import FakeCheckout from "../../FakeCheckout";
import { requireUser } from "../../requireUser";
import styles from "../../lists.module.css";

export const metadata: Metadata = {
  title: "Promote your list",
  robots: { index: false },
};

export default function PromoteListPage(props: PageProps<"/lists/[id]/promote">) {
  return (
    <main className={styles.narrowPage}>
      <h1 className={styles.pageTitle}>Promote your list</h1>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Promote params={props.params} />
      </Suspense>
    </main>
  );
}

async function Promote({ params }: Pick<PageProps<"/lists/[id]/promote">, "params">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { supabase, user } = await requireUser(`/lists/${id}/promote`);

  const { data: list } = await supabase
    .from("user_lists")
    .select("id, title, user_id, status")
    .eq("id", Number(id))
    .maybeSingle();
  if (!list || list.user_id !== user.id || list.status !== "published") notFound();

  const { startsAt, endsAt, startsNow } = await previewPromotion(list.id, PROMOTE_OFFER.days);

  return (
    <FakeCheckout
      item={`${PROMOTE_OFFER.days} days promoted: “${list.title}”`}
      price={formatPrice(PROMOTE_OFFER.amountCents)}
      details={[
        startsNow
          ? `Your list goes into a promoted spot right away, until about ${formatDate(endsAt)}.`
          : `Both spots are booked, so your days wait their turn: about ${formatDate(startsAt)} to ${formatDate(endsAt)}.`,
        "You get the full time either way.",
      ]}
      pay={promoteList.bind(null, list.id)}
    />
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { getListOffer } from "../../../../../lib/listPurchases";
import { formatPrice } from "../../../../../lib/userLists";
import { buyList } from "../../actions";
import FakeCheckout from "../../FakeCheckout";
import { requireUser } from "../../requireUser";
import UsernameGate from "../../UsernameGate";
import styles from "../../lists.module.css";

export const metadata: Metadata = {
  title: "Create your Top 10",
  robots: { index: false },
};

export default function NewListCheckoutPage() {
  return (
    <main className={styles.narrowPage}>
      <h1 className={styles.pageTitle}>Create your Top 10</h1>
      {/* Reads the login cookie at request time, so it sits inside Suspense */}
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Checkout />
      </Suspense>
    </main>
  );
}

async function Checkout() {
  const { user, username } = await requireUser("/lists/new/checkout");
  if (!username) return <UsernameGate />;

  const offer = await getListOffer(user.id);
  const first = offer.kind === "first_list";

  return (
    <FakeCheckout
      item={first ? "Your first Top 10 list" : "Another Top 10 list"}
      price={formatPrice(offer.amountCents)}
      details={
        first
          ? [
              "Build your list, then publish it to The Lists.",
              `Comes with ${offer.promoDays} days in a promoted spot at the top of the page, starting when you publish.`,
            ]
          : [
              "Build another list, then publish it to The Lists.",
              "Want it at the top? You can promote it for 30 days after it's published.",
            ]
      }
      pay={buyList}
    />
  );
}

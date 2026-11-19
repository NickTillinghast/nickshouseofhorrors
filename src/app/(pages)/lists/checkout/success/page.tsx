import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fulfillCheckoutSession, stripe } from "@lib/stripe";
import { requireUser } from "../../requireUser";
import styles from "../../lists.module.css";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false },
};

// Stripe sends the fan here after paying. Records the purchase if the webhook hasn't yet
// (src/lib/stripe.ts), then takes them to build their list or back to My lists
export default function CheckoutSuccessPage(props: PageProps<"/lists/checkout/success">) {
  return (
    <main className={styles.narrowPage}>
      <Suspense fallback={<p className={styles.muted}>Confirming your payment…</p>}>
        <Success searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Success({
  searchParams,
}: Pick<PageProps<"/lists/checkout/success">, "searchParams">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) notFound();

  const { user } = await requireUser(
    `/lists/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
  );

  let session;
  try {
    session = await stripe().checkout.sessions.retrieve(sessionId);
  } catch {
    notFound();
  }
  // Only the person who paid can open their receipt page
  if (session.client_reference_id !== user.id) notFound();

  let result;
  try {
    result = await fulfillCheckoutSession(session);
  } catch (error) {
    console.error("Couldn't record checkout", sessionId, error);
    return <Problem />;
  }

  if (result.status === "done") {
    redirect(result.kind === "promote" ? "/lists/mine" : `/lists/${result.listId}/edit`);
  }

  // Not cleared yet: check again in a few seconds
  return (
    <>
      <meta httpEquiv="refresh" content="4" />
      <h1 className={styles.pageTitle}>Confirming your payment…</h1>
      <p className={styles.muted}>
        Stripe is still confirming it with your bank. This page checks again by itself, and your
        list will be waiting in{" "}
        <Link href="/lists/mine" className={styles.inlineLink}>
          My lists
        </Link>{" "}
        as soon as it goes through.
      </p>
    </>
  );
}

function Problem() {
  return (
    <>
      <h1 className={styles.pageTitle}>Payment received</h1>
      <p>
        Your payment went through, but we hit a snag setting things up. No need to pay again: Stripe
        keeps retrying, and it should show up in{" "}
        <Link href="/lists/mine" className={styles.inlineLink}>
          My lists
        </Link>{" "}
        within a few minutes. Still missing after an hour?{" "}
        <Link href="/refunds" className={styles.inlineLink}>
          Get in touch
        </Link>{" "}
        and we&apos;ll fix it or refund you.
      </p>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import styles from "./lists.module.css";

type CheckoutSummaryProps = {
  item: string;
  details: string[];
  price: string;
  // A Server Action bound to what's being bought. It sends the browser to Stripe's payment page
  pay: () => Promise<{ error?: string }>;
  // Back from Stripe's page without paying
  canceled?: boolean;
};

// What's being bought and the price. Card details are entered on Stripe's own page,
// they never touch this site
export default function CheckoutSummary({
  item,
  details,
  price,
  pay,
  canceled,
}: CheckoutSummaryProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await pay();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form className={styles.checkout} onSubmit={submit}>
      {canceled && (
        <p className={styles.notice} role="status">
          Payment canceled. You weren&apos;t charged.
        </p>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryItem}>{item}</span>
          <span className={styles.price}>{price}</span>
        </div>
        {details.map((detail) => (
          <p key={detail} className={styles.summaryDetail}>
            {detail}
          </p>
        ))}
      </div>

      <button type="submit" className={styles.primary} disabled={pending}>
        {pending ? "Opening checkout…" : "Continue to payment"}
      </button>
      <p className={styles.muted}>
        Payments are handled securely by Stripe. Have a promo code? Add it on the next page.
      </p>
      <p className={styles.error} aria-live="polite">
        {error}
      </p>
    </form>
  );
}

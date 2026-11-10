"use client";

import { useState, useTransition } from "react";
import styles from "./lists.module.css";

type FakeCheckoutProps = {
  item: string;
  details: string[];
  price: string;
  // A Server Action bound to what's being bought. It redirects when the payment goes through
  pay: () => Promise<{ error?: string }>;
};

// Stand-in for a real payment form so the whole flow can be tried out.
// Nothing typed here is sent anywhere; swapping in Stripe Checkout replaces this component
export default function FakeCheckout({ item, details, price, pay }: FakeCheckoutProps) {
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
      <p className={styles.testBanner}>Test mode: no real charge. Don&apos;t enter a real card.</p>

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

      <fieldset className={styles.card} disabled={pending}>
        <legend className={styles.cardLegend}>Card (test)</legend>
        <label className={styles.field}>
          Card number
          <input
            className={styles.input}
            defaultValue="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="off"
          />
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            Expires
            <input className={styles.input} defaultValue="12 / 34" autoComplete="off" />
          </label>
          <label className={styles.field}>
            CVC
            <input
              className={styles.input}
              defaultValue="123"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
        </div>
      </fieldset>

      <button type="submit" className={styles.primary} disabled={pending}>
        {pending ? "Processing…" : `Pay ${price}`}
      </button>
      <p className={styles.error} aria-live="polite">
        {error}
      </p>
    </form>
  );
}

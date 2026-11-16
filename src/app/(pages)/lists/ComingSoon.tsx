import Link from "next/link";
import { BATTLES_PATH } from "@lib/battleShared";
import styles from "./lists.module.css";

// Shown on the checkout and promote pages while LIST_SALES_OPEN is false
export default function ComingSoon({ what }: { what: string }) {
  return (
    <section className={styles.card}>
      <p className={styles.comingSoonBadge}>Coming soon</p>
      <p>{what} isn&apos;t open yet. Nick is still sharpening the knives, check back soon.</p>
      <p className={styles.muted}>
        In the meantime, see Nick&apos;s picks and the fans&apos; Top 10s, or settle who would win
        in the Blood Bathroom.
      </p>
      <div className={styles.comingSoonLinks}>
        <Link href="/lists" className={styles.primaryLink}>
          See The Lists
        </Link>
        <Link href={BATTLES_PATH} className={styles.small}>
          Blood Bathroom
        </Link>
      </div>
    </section>
  );
}

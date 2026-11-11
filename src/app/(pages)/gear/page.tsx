import type { Metadata } from "next";
import { gearByCategory } from "@lib/gear";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Horror Gear",
  description: "Horror merch, decor and movie-night essentials picked by Nicks House of Horrors.",
  alternates: { canonical: "/gear" },
};

export default function GearPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={`${styles.title} font-heading`}>Horror Gear</h1>
        <p className={styles.intro}>
          Merch, decor and movie-night essentials for people who sleep with the lights on.
        </p>
      </header>

      {gearByCategory().map(([category, items]) => (
        <section key={category} className={styles.section} aria-labelledby={`gear-${category}`}>
          <h2 id={`gear-${category}`} className={styles.category}>
            {category}
          </h2>
          <ul className={styles.grid}>
            {items.map((item) => (
              <li key={item.href} className={styles.card}>
                <h3 className={styles.name}>{item.name}</h3>
                <p className={styles.description}>{item.description}</p>
                {/* "sponsored" tells search engines this is an affiliate link */}
                <a
                  href={item.href}
                  className={styles.button}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  View on Amazon
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Amazon requires this wherever affiliate links appear */}
      <p className={styles.disclosure}>
        As an Amazon Associate, Nicks House of Horrors earns from qualifying purchases.
      </p>
    </main>
  );
}

import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@lib/site";
import { SOCIAL_LINKS } from "@lib/navigation";
import styles from "./legal.module.css";

// Shared layout for /terms, /privacy and /refunds. Plain English on purpose.
// Written as a starting point for Nick to review, not legal advice

export const LAST_UPDATED = "November 18, 2026";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <h1 className={`${styles.title} font-heading`}>{title}</h1>
      <p className={styles.updated}>Last updated {LAST_UPDATED}</p>
      {children}
    </main>
  );
}

// How to reach Nick: the contact email once it's set, Instagram until then
export function Contact() {
  if (CONTACT_EMAIL) {
    return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  }
  const instagram = SOCIAL_LINKS.find((link) => link.label === "Instagram")?.href;
  return (
    <a href={instagram} target="_blank" rel="noopener noreferrer">
      a direct message on Instagram
    </a>
  );
}

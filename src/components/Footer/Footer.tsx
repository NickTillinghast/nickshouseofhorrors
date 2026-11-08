import Link from "next/link";
import { Creepster } from "next/font/google";
import { siFacebook, siGithub, siInstagram } from "simple-icons";
import { MY_MOVIES_LABEL, NAV_LINKS, SOCIAL_LINKS } from "../../lib/navigation";
import { SITE_NAME } from "../../lib/site";
import styles from "./Footer.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

// The Lists has no page yet, so keep it out of the site map until it does
const SITE_MAP = [
  ...NAV_LINKS.filter((link) => link.href !== "/lists"),
  { href: "/profile", label: MY_MOVIES_LABEL },
];

// Official brand shapes from simple-icons (CC0), drawn in our own colors
const ICONS: Record<string, { path: string }> = {
  GitHub: siGithub,
  Facebook: siFacebook,
  Instagram: siInstagram,
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.brand}>
          <Link href="/home" className={`${styles.name} ${creepster.className}`}>
            {SITE_NAME}
          </Link>
          <p className={styles.tagline}>
            Hunt down your next nightmare. Browse horror by subgenre, find out where to stream it,
            and keep the ones that haunt you.
          </p>
        </div>

        <nav aria-labelledby="footer-sitemap">
          <h2 id="footer-sitemap" className={styles.heading}>
            Site map
          </h2>
          <ul className={styles.list}>
            {SITE_MAP.map(({ href, label }) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-follow">
          <h2 id="footer-follow" className={styles.heading}>
            Follow
          </h2>
          <ul className={styles.socials}>
            {SOCIAL_LINKS.map(({ href, label }) => {
              const icon = (
                <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
                  <path d={ICONS[label]?.path} />
                </svg>
              );

              return (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.social}
                      aria-label={`${SITE_NAME} on ${label}`}
                      title={label}
                    >
                      {icon}
                    </a>
                  ) : (
                    // No page yet, show the icon but don't link anywhere
                    <span
                      className={`${styles.social} ${styles.socialSoon}`}
                      title={`${label} coming soon`}
                    >
                      {icon}
                      <span className={styles.srOnly}>{label} coming soon</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>© 2026 {SITE_NAME}</p>
        {/* Both data providers ask for credit in their terms of use */}
        <p>
          Movie data from{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming data
          from{" "}
          <a href="https://www.watchmode.com/" target="_blank" rel="noopener noreferrer">
            Watchmode
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

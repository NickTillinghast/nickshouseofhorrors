import { getImageProps } from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

// Wide screens get the SVG, phones held upright get the tall PNG (resized by Next for each phone)
const DESKTOP_SRC = "/assets/gore-enter-guts-layered-lighter.svg";
const { props: mobileImage } = getImageProps({
  src: "/assets/enter-guts-mobile-1170x2532.png",
  alt: "logo and gory gutz image",
  width: 1170,
  height: 2532,
  sizes: "100vw",
  fetchPriority: "high",
});

export default function SplashPage() {
  return (
    <main className={styles.splash}>
      {/* The whole scene is the way in, "ENteR" is drawn into the artwork */}
      <Link href="/home" className={styles.scene} aria-label="Enter Nick's House of Horrors">
        <picture>
          <source media="(orientation: landscape)" srcSet={DESKTOP_SRC} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from mobileImage, the link has the label */}
          <img {...mobileImage} className={styles.sceneImage} />
        </picture>
      </Link>

      {/* Real text and links, so search engines know what the site is about */}
      <footer className={styles.intro}>
        <h1 className={`${styles.introTitle} font-heading`}>Nicks House of Horrors</h1>
        <p className={styles.introText}>
          Find your next horror movie: browse by subgenre, see where to stream it, and spin the reel
          for a random scare.
        </p>
        <nav className={styles.introLinks} aria-label="Explore">
          <Link href="/movies">Browse horror movies</Link>
          <Link href="/home">Popular this week</Link>
        </nav>
      </footer>
    </main>
  );
}

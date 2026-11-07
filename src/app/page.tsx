import Image from "next/image";
import Link from "next/link";
import { Creepster } from "next/font/google";
import styles from "./page.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

export default function SplashPage() {
  return (
    <main className={styles.splash}>
      <div className={styles.scene}>
        <Image
          src="/assets/nicks-house-entrance-no-text.svg"
          alt="Nick's House of Horrors entrance"
          fill
          preload
          unoptimized
        />

        <Link href="/home" className={`${styles.enter} ${creepster.className}`}>
          Enter
          <br />
          Here
        </Link>
      </div>

      {/* Real text and links, so search engines know what the site is about */}
      <footer className={styles.intro}>
        <h1 className={`${styles.introTitle} ${creepster.className}`}>Nicks House of Horrors</h1>
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

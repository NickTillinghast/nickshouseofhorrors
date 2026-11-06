import Image from "next/image";
import Link from "next/link";
import { Creepster } from "next/font/google";
import HorrorReel from "../../../components/HorrorReel/HorrorReel";
import { getTopRatedHorrorMovies } from "../../../lib/tmdb";
import HeartsCta from "./HeartsCta";
import styles from "./page.module.css";

const creepster = Creepster({ weight: "400", subsets: ["latin"] });

const HEART_STEPS = [
  {
    title: "Heart a movie",
    text: "Tap the heart on any movie card. It fills in red once it's saved.",
  },
  {
    title: "It's saved to your profile",
    text: "Hearts belong to your account, so they follow you to any device.",
  },
  {
    title: "Find them in My Hearts",
    text: "Every movie you've hearted sits in one grid, ready for movie night.",
  },
];

export default async function HomePage() {
  // The reel starts with the best-loved classics, "New movies" swaps in a random set
  const reelMovies = await getTopRatedHorrorMovies(10);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={`${styles.title} ${creepster.className}`}>Nicks House of Horrors</h1>
        <p className={styles.tagline}>
          Hunt down your next nightmare. Browse horror by subgenre, find out where to stream it, and
          keep the ones that haunt you.
        </p>
        <Link href="/movies" className={styles.primaryButton}>
          Browse movies
        </Link>
      </section>

      <section className={styles.section} aria-labelledby="hearts-heading">
        <h2 id="hearts-heading" className={styles.heading}>
          How hearts work
        </h2>
        <ol className={styles.steps}>
          {HEART_STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <Image
                className={i === 0 ? styles.stepHeartEmpty : styles.stepHeart}
                src="/assets/anatomical-heart-svgrepo-com.svg"
                alt=""
                width={40}
                height={40}
              />
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>{i + 1}</span> {step.title}
              </h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
        <HeartsCta />
      </section>

      <section className={styles.section} aria-labelledby="reel-heading">
        <h2 id="reel-heading" className={`${styles.heading} ${creepster.className}`}>
          Can&apos;t decide? Spin the reel
        </h2>
        <p className={styles.sectionText}>
          Let fate pick tonight&apos;s scare. Choose a genre or load a new set of movies.
        </p>
        <HorrorReel initialMovies={reelMovies} />
      </section>
    </main>
  );
}

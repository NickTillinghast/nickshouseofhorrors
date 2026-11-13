import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HorrorReel from "@components/HorrorReel/HorrorReel";
import JsonLd from "@components/JsonLd/JsonLd";
import MovieList from "@components/MovieList/MovieList";
import { SOCIAL_LINKS } from "@lib/navigation";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@lib/site";
import { getPopularHorrorMovies, getTopRatedHorrorMovies } from "@lib/tmdb";
import { getFeaturedList } from "@lib/userLists";
import HeartsInfo from "./HeartsInfo";
import QuizTeaser from "./QuizTeaser";
import styles from "./page.module.css";

// Tells Google the site's name (shown above results) and links its social profiles
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["Nick's House of Horrors", "nickshouseofhorrors.com"],
      url: `${SITE_URL}/home`,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/home`,
      logo: `${SITE_URL}/apple-icon.png`,
      sameAs: SOCIAL_LINKS.map((link) => link.href).filter(Boolean),
    },
  ],
};

export const metadata: Metadata = {
  title: "Popular Horror Movies, Random Picks & Where to Watch",
  description:
    "See the 50 horror movies everyone's watching this week, spin the reel for a random scary movie, and heart your favorites.",
  alternates: { canonical: "/home" },
};

export default async function HomePage() {
  // The reel starts with the best-loved classics, "New movies" swaps in a random set
  const [reelMovies, popularMovies, nicksPicks] = await Promise.all([
    getTopRatedHorrorMovies(10),
    getPopularHorrorMovies(50),
    getFeaturedList(),
  ]);

  return (
    <main className={styles.page}>
      <JsonLd data={siteJsonLd} />
      <section className={styles.hero}>
        {/* The logo is the heading; its alt text keeps the site name readable for Google and screen readers */}
        <h1 className={styles.logoHeading}>
          <Image
            className={styles.logo}
            src="/assets/gore-emblem-wide.svg"
            alt="Nicks House of Horrors"
            width={2048}
            height={1365}
            sizes="(max-width: 720px) 100vw, 640px"
            loading="eager"
            fetchPriority="high"
          />
        </h1>
        <p className={styles.tagline}>
          Hunt down your next nightmare. Browse horror by subgenre, find out where to stream it, and
          keep the ones that haunt you.
        </p>
        <Link href="/movies" className={styles.primaryButton}>
          Browse movies
        </Link>
      </section>

      {/* Quiz, Nick's Picks and a scrolling top 50 side by side (stacked on smaller screens) */}
      <div className={styles.split}>
        <QuizTeaser titleClassName="font-heading" />

        <div className={styles.splitList}>
          <MovieList
            title={nicksPicks?.title ?? "Nick's Picks"}
            titleHref={nicksPicks ? `/lists/${nicksPicks.id}` : "/lists"}
            description="Nick's all-time Top 10"
            badge="Nick's picks"
            movies={nicksPicks?.movies ?? []}
            redBottom
            emptyText="Coming soon. Nick is still arguing with himself about number 1."
          />
        </div>

        <div className={styles.splitList}>
          <MovieList
            title="Popular right now"
            description="The 50 horror movies everyone's watching this week"
            movies={popularMovies}
            redBottom
          />
        </div>
      </div>

      <section className={styles.section} aria-labelledby="reel-heading">
        <h2 id="reel-heading" className={`${styles.heading} font-heading`}>
          Can&apos;t decide? Spin the reel
        </h2>
        <p className={styles.sectionText}>
          Let fate pick tonight&apos;s scare. Choose a genre or load a new set of movies.
        </p>
        <HorrorReel initialMovies={reelMovies} />
      </section>

      <HeartsInfo />
    </main>
  );
}

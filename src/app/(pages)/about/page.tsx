import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About Nick: The Horror Fanatic Behind the House",
  description:
    "Nicks House of Horrors is built by a lifelong horror fanatic and festival regular, a place to brag about your favorite horror movies, test your horror knowledge and find your next great scare.",
  alternates: { canonical: "/about" },
  openGraph: {
    images: [
      { url: "/assets/nick-portrait.jpg", alt: "Nick in a hoodie in front of horror posters" },
    ],
  },
};

// What the site is for, each one a way in
const ROOMS = [
  {
    title: "Brag about your favorites",
    text: "Build your all-time Top 10, rank it exactly how you'd argue it at 2 a.m., and put it on The Lists for every horror nerd to see.",
    href: "/lists",
    cta: "See The Lists",
  },
  {
    title: "Test your horror knowledge",
    text: "From a quick Jump Scare to all 100 questions of Unkillable. Beat the clock, climb the leaderboard, earn your badge.",
    href: "/quiz",
    cta: "Take the quiz",
  },
  {
    title: "Find your next great find",
    text: "Dig through every subgenre, from slashers to folk horror and giallo, see where it's streaming, or let the reel pick tonight's scare.",
    href: "/movies",
    cta: "Browse movies",
  },
  {
    title: "Keep your legacy alive",
    text: "Heart the ones that haunt you, so your favorites are waiting on every device, and share them with the next generation of freaks.",
    href: "/home",
    cta: "Start hearting",
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.photoFrame}>
          <Image
            className={styles.photo}
            src="/assets/nick-portrait.jpg"
            alt="Nick, in a hoodie lit red and teal, in front of Texas Chain Saw Massacre and Night of the Living Dead posters"
            width={2000}
            height={1333}
            sizes="(max-width: 860px) 100vw, 520px"
            preload
          />
        </div>

        <div className={styles.intro}>
          <p className={styles.kicker}>Meet your host</p>
          <h1 className={`${styles.title} font-heading`}>Welcome to the House</h1>
          <p className={styles.lead}>
            I&apos;m Nick, and horror isn&apos;t a genre to me. It&apos;s a lifestyle.
          </p>
          <p>
            I&apos;ve been a horror fanatic for as long as I can remember: the VHS covers I
            wasn&apos;t allowed to rent, the movies I watched through my fingers, the ones I still
            can&apos;t shake. Somewhere along the way it stopped being something I watched and
            became part of who I am.
          </p>
        </div>
      </section>

      <section className={styles.story}>
        <h2 className={`${styles.sectionTitle} font-heading`}>Why I built this place</h2>
        <p>
          I&apos;ve been to a lot of horror festivals, and the best part was never only what was on
          the screen. It was the line outside and the lobby after: swapping favorites with
          strangers, defending a deep cut nobody else had seen, and arguing about what you&apos;d
          really do if the dead started walking. Talking about these movies like they actually
          happened, because to us, they kind of did.
        </p>
        <p>
          {SITE_NAME} is my attempt to bottle that feeling and keep the lights low all year round. A
          place to brag about your favorites, prove what you know, and find the next great horror
          movie to pass on, so the legacy keeps crawling forward.
        </p>
        <blockquote className={styles.quote}>
          <p>
            &ldquo;In space, no one can hear you scream. In here, everyone screams together.&rdquo;
          </p>
        </blockquote>
      </section>

      <section aria-labelledby="rooms-title">
        <h2 id="rooms-title" className={`${styles.sectionTitle} font-heading`}>
          Rooms in the House
        </h2>
        <ul className={styles.rooms}>
          {ROOMS.map((room) => (
            <li key={room.title} className={styles.room}>
              <h3 className={styles.roomTitle}>{room.title}</h3>
              <p className={styles.roomText}>{room.text}</p>
              <Link href={room.href} className={styles.roomLink}>
                {room.cta} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.closing}>
        <p className={`${styles.closingTitle} font-heading`}>
          Pull up a seat. The lights are going down.
        </p>
        <p className={styles.closingText}>
          Whether you&apos;ve seen them all or you&apos;re just getting started, you belong here.
        </p>
        <div className={styles.closingLinks}>
          <Link href="/lists/new/checkout" className={styles.primary}>
            Make your Top 10
          </Link>
          <Link href="/quiz" className={styles.secondary}>
            Test yourself
          </Link>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import BattleCard from "@components/Battle/BattleCard";
import BattleVotesProvider from "@components/Battle/BattleVotesProvider";
import LazyComments from "@components/Battle/LazyComments";
import { BATTLES_LABEL, BATTLES_PATH, getBattles } from "@lib/battles";
import { BATTLE_SUGGESTIONS_THREAD } from "@lib/comments";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Who Would Win? Horror Villain Battles",
  description:
    "Jason vs Michael, Freddy vs Chucky: vote on who would win in a fight between horror's biggest killers, see who's winning and argue it out in the comments.",
  alternates: { canonical: BATTLES_PATH },
};

export default async function BloodBathroomPage() {
  const battles = await getBattles();

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>{BATTLES_LABEL}</p>
        <h1 className={`${styles.title} font-heading`}>Who Would Win?</h1>
        <p className={styles.text}>
          Two killers walk in, one walks out. Pick your fighter, see who&apos;s winning, and make
          your case in the comments. Changed your mind? Switch sides any time.
        </p>
      </header>

      {battles.length ? (
        <BattleVotesProvider battleIds={battles.map((battle) => battle.id)}>
          <ol className={styles.battles}>
            {battles.map((battle, i) => (
              <li key={battle.id}>
                <BattleCard battle={battle} priority={i === 0} />
              </li>
            ))}
          </ol>
        </BattleVotesProvider>
      ) : (
        <p className={`${styles.battles} ${styles.empty}`}>
          The first battle is being cleaned up. Check back soon.
        </p>
      )}

      {/* After the battles on phones, beside the intro on desktop (see page.module.css) */}
      <section className={styles.suggestions} aria-label="Suggest a battle">
        <LazyComments thread={BATTLE_SUGGESTIONS_THREAD} label="Suggest a battle" />
      </section>
    </main>
  );
}

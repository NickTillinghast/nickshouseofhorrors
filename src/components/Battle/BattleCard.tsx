import Image from "next/image";
import Link from "next/link";
import { battleThread } from "@lib/comments";
import { battleHref, battleTitle, type Battle, type Fighter } from "@lib/battleShared";
import BattleVote from "./BattleVote";
import LazyComments from "./LazyComments";
import styles from "./Battle.module.css";

type BattleCardProps = {
  battle: Battle;
  // The battle's own page uses h1, lists of battles use h2
  headingLevel?: "h1" | "h2" | "h3";
  // Off on the battle's own page, where the title would link to itself
  linkTitle?: boolean;
  // The first battle on a page loads its fighters right away
  priority?: boolean;
};

function FighterImage({ fighter, priority }: { fighter: Fighter; priority: boolean }) {
  return (
    <figure className={styles.fighter}>
      {/* Pixel art: unoptimized keeps every pixel sharp instead of resampling it */}
      <Image
        className={styles.fighterImage}
        src={fighter.image}
        alt={fighter.name}
        width={256}
        height={256}
        unoptimized
        preload={priority}
      />
      <figcaption className={`${styles.fighterName} font-heading`}>{fighter.name}</figcaption>
    </figure>
  );
}

export default function BattleCard({
  battle,
  headingLevel: Heading = "h2",
  linkTitle = true,
  priority = false,
}: BattleCardProps) {
  const title = battleTitle(battle);

  return (
    <article className={styles.card} aria-label={title}>
      <div className={styles.fight}>
        <header className={styles.header}>
          <Heading className={styles.title}>
            {linkTitle ? (
              <Link href={battleHref(battle)} className={styles.titleLink}>
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
          {battle.tagline && <p className={styles.tagline}>{battle.tagline}</p>}
        </header>

        <div className={styles.arena}>
          <FighterImage fighter={battle.left} priority={priority} />
          <span className={`${styles.versus} font-heading`} aria-hidden="true">
            VS
          </span>
          <FighterImage fighter={battle.right} priority={priority} />
        </div>

        <BattleVote
          battleId={battle.id}
          leftName={battle.left.name}
          rightName={battle.right.name}
        />
      </div>

      <LazyComments thread={battleThread(battle.id)} label="Make your case" />
    </article>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BattleCard from "@components/Battle/BattleCard";
import BattleVotesProvider from "@components/Battle/BattleVotesProvider";
import { BATTLES_LABEL, BATTLES_PATH, battleHref, battleTitle, getBattle } from "@lib/battles";
import styles from "../page.module.css";

async function loadBattle(params: PageProps<"/blood-bathroom/[slug]">["params"]) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return getBattle(slug);
}

export async function generateMetadata(
  props: PageProps<"/blood-bathroom/[slug]">,
): Promise<Metadata> {
  const battle = await loadBattle(props.params);
  if (!battle) return { title: "Battle not found" };

  const title = `${battleTitle(battle)}: Who Would Win?`;
  const description = `Who would win in a fight, ${battle.left.name} or ${battle.right.name}? Vote, see who's winning and argue it out in the comments.`;
  const images = [{ url: battle.left.image, alt: battle.left.name }];

  return {
    title,
    description,
    alternates: { canonical: battleHref(battle) },
    openGraph: { title, description, images },
    twitter: { card: "summary", title, description, images },
  };
}

export default function BattlePage(props: PageProps<"/blood-bathroom/[slug]">) {
  return (
    <main className={styles.page}>
      <Link href={BATTLES_PATH} className={styles.back}>
        ← {BATTLES_LABEL}
      </Link>
      {/* The slug comes from the URL at request time, so it has to sit inside Suspense */}
      <Suspense fallback={<p className={styles.empty}>Setting up the fight…</p>}>
        <Battle params={props.params} />
      </Suspense>
    </main>
  );
}

async function Battle({ params }: Pick<PageProps<"/blood-bathroom/[slug]">, "params">) {
  const battle = await loadBattle(params);
  if (!battle) notFound();

  return (
    <BattleVotesProvider battleIds={[battle.id]}>
      <BattleCard battle={battle} headingLevel="h1" linkTitle={false} priority />
    </BattleVotesProvider>
  );
}

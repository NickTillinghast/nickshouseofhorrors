import type { Metadata } from "next";
import {
  Barlow,
  Barlow_Condensed,
  Bebas_Neue,
  Butcherman,
  Creepster,
  Crimson_Pro,
  EB_Garamond,
  Eater,
  Inter,
  Metal_Mania,
  Nosifer,
  Oswald,
  Pirata_One,
  Rubik_Wet_Paint,
  Special_Elite,
  UnifrakturMaguntia,
} from "next/font/google";
import styles from "./page.module.css";

// Temporary page for picking the site's fonts. Delete this folder once one is chosen
export const metadata: Metadata = {
  title: "Font preview",
  robots: { index: false },
};

// Horror display fonts, for big headings only
const creepster = Creepster({ weight: "400", subsets: ["latin"] });
const nosifer = Nosifer({ weight: "400", subsets: ["latin"] });
const butcherman = Butcherman({ weight: "400", subsets: ["latin"] });
const eater = Eater({ weight: "400", subsets: ["latin"] });
const metalMania = Metal_Mania({ weight: "400", subsets: ["latin"] });
const rubikWetPaint = Rubik_Wet_Paint({ weight: "400", subsets: ["latin"] });
const pirataOne = Pirata_One({ weight: "400", subsets: ["latin"] });
const unifraktur = UnifrakturMaguntia({ weight: "400", subsets: ["latin"] });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"] });

// Readable fonts for text, labels and buttons
const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });
const barlow = Barlow({ weight: ["400", "600", "700"], subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({ weight: ["500", "700"], subsets: ["latin"] });
const crimson = Crimson_Pro({ subsets: ["latin"] });
const garamond = EB_Garamond({ subsets: ["latin"] });

type Font = { style: { fontFamily: string } };
const family = (font: Font) => ({ fontFamily: font.style.fontFamily });
// The site's current text font, already loaded by the root layout
const geist: Font = { style: { fontFamily: "var(--font-geist-sans), sans-serif" } };

const COMBOS: {
  name: string;
  vibe: string;
  heading: Font;
  headingName: string;
  label: Font;
  labelName: string;
  body: Font;
  bodyName: string;
}[] = [
  {
    name: "Current",
    vibe: "What the site uses today",
    heading: creepster,
    headingName: "Creepster",
    label: geist,
    labelName: "Geist",
    body: geist,
    bodyName: "Geist",
  },
  {
    name: "1 · VHS rental shop",
    vibe: "Campy B-movie headings, poster-credit labels, easy reading",
    heading: creepster,
    headingName: "Creepster",
    label: oswald,
    labelName: "Oswald",
    body: inter,
    bodyName: "Inter",
  },
  {
    name: "2 · Slasher",
    vibe: "Grittier and rougher",
    heading: butcherman,
    headingName: "Butcherman",
    label: barlowCondensed,
    labelName: "Barlow Condensed",
    body: barlow,
    bodyName: "Barlow",
  },
  {
    name: "3 · Hammer gothic",
    vibe: "Classic Dracula and folk horror, a bit classy",
    heading: pirataOne,
    headingName: "Pirata One",
    label: bebas,
    labelName: "Bebas Neue",
    body: crimson,
    bodyName: "Crimson Pro",
  },
  {
    name: "4 · Modern drip",
    vibe: "Clean and current, still clearly horror",
    heading: rubikWetPaint,
    headingName: "Rubik Wet Paint",
    label: oswald,
    labelName: "Oswald",
    body: inter,
    bodyName: "Inter",
  },
  {
    name: "5 · 80s metal",
    vibe: "Heavy-metal album cover meets video store",
    heading: creepster,
    headingName: "Creepster",
    label: bebas,
    labelName: "Bebas Neue",
    body: barlow,
    bodyName: "Barlow",
  },
];

const HEADING_FONTS: [string, Font][] = [
  ["Creepster", creepster],
  ["Nosifer", nosifer],
  ["Butcherman", butcherman],
  ["Eater", eater],
  ["Metal Mania", metalMania],
  ["Rubik Wet Paint", rubikWetPaint],
  ["Pirata One", pirataOne],
  ["UnifrakturMaguntia", unifraktur],
  ["Special Elite", specialElite],
];

const BODY_FONTS: [string, Font][] = [
  ["Inter", inter],
  ["Barlow", barlow],
  ["Crimson Pro", crimson],
  ["EB Garamond", garamond],
];

const LABEL_FONTS: [string, Font][] = [
  ["Oswald", oswald],
  ["Bebas Neue", bebas],
  ["Barlow Condensed", barlowCondensed],
];

const SAMPLE_TEXT =
  "Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, along with his wife Wendy and their son Danny, must live isolated from the rest of the world for the winter.";

export default function FontPreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1>Font preview</h1>
        <p>
          Each combo uses a horror font for big headings, a condensed font for labels and buttons,
          and a readable font for text. Temporary page, not linked anywhere.
        </p>
      </header>

      <h2 className={styles.groupTitle}>Combos on real site pieces</h2>
      <div className={styles.combos}>
        {COMBOS.map((combo) => (
          <section key={combo.name} className={styles.combo} style={family(combo.body)}>
            <p className={styles.comboName}>
              {combo.name} <span>{combo.vibe}</span>
            </p>

            <p className={styles.heroTitle} style={family(combo.heading)}>
              The Lists
            </p>
            <p className={styles.sectionTitle} style={family(combo.heading)}>
              Can&apos;t decide? Spin the reel
            </p>

            <div className={styles.badges} style={family(combo.label)}>
              <span className={styles.badge}>Top rated</span>
              <span className={styles.badge}>Nick&apos;s picks</span>
              <span className={`${styles.badge} ${styles.badgeGold}`}>Only legends survive</span>
            </div>

            <article className={styles.card}>
              <p className={styles.cardTitle}>
                The Shining <span>(1980)</span>
              </p>
              <p className={styles.tagline}>A masterpiece of modern horror.</p>
              <p className={styles.body}>{SAMPLE_TEXT}</p>
              <div className={styles.buttons} style={family(combo.label)}>
                <span className={styles.primary}>Take the quiz</span>
                <span className={styles.secondary}>How to watch</span>
              </div>
            </article>

            <nav className={styles.nav} style={family(combo.label)}>
              <span>Home</span>
              <span className={styles.navActive}>Movies</span>
              <span>Quiz</span>
              <span>The Lists</span>
            </nav>

            <p className={styles.credits}>
              Headings: <strong>{combo.headingName}</strong> · Labels:{" "}
              <strong>{combo.labelName}</strong> · Text: <strong>{combo.bodyName}</strong>
            </p>
          </section>
        ))}
      </div>

      <h2 className={styles.groupTitle}>Every horror heading font</h2>
      <div className={styles.gallery}>
        {HEADING_FONTS.map(([name, font]) => (
          <div key={name} className={styles.sample}>
            <p className={styles.sampleName}>{name}</p>
            <p className={styles.sampleBig} style={family(font)}>
              Nicks House of Horrors
            </p>
            <p className={styles.sampleMedium} style={family(font)}>
              Horror Trivia · Ultimate Top 10
            </p>
          </div>
        ))}
      </div>

      <h2 className={styles.groupTitle}>Label fonts</h2>
      <div className={styles.gallery}>
        {LABEL_FONTS.map(([name, font]) => (
          <div key={name} className={styles.sample} style={family(font)}>
            <p className={styles.sampleName}>{name}</p>
            <div className={styles.badges}>
              <span className={styles.badge}>Promoted</span>
              <span className={`${styles.badge} ${styles.badgeGold}`}>Top unkillables</span>
            </div>
            <p className={styles.sampleLabelRow}>Home · Movies · Quiz · Horror Gear · The Lists</p>
          </div>
        ))}
      </div>

      <h2 className={styles.groupTitle}>Text fonts</h2>
      <div className={styles.gallery}>
        {BODY_FONTS.map(([name, font]) => (
          <div key={name} className={styles.sample} style={family(font)}>
            <p className={styles.sampleName}>{name}</p>
            <p className={styles.body}>{SAMPLE_TEXT}</p>
            <p className={styles.small}>2026 · ★ 8.2 · 144 min · fauxhammer 51/100 20:03.1</p>
          </div>
        ))}
      </div>
    </main>
  );
}

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
    </main>
  );
}

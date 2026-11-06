"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "../Favorites/FavoritesProvider";
import styles from "./Navbar.module.css";

const links = [
  { href: "/home", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/lists", label: "The Lists" },
];

function Account({ pathname }: { pathname?: string }) {
  const { user, signOut } = useFavorites();

  if (!user) {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/login${next}`} className={styles.signIn}>
        Sign in
      </Link>
    );
  }

  const name = user.user_metadata.full_name ?? user.email ?? "You";
  const avatarUrl: string | undefined = user.user_metadata.avatar_url;

  return (
    <div className={styles.account}>
      <Link
        href="/profile"
        className={`${styles.profileLink} ${pathname?.startsWith("/profile") ? styles.active : ""}`}
      >
        {avatarUrl ? (
          <Image className={styles.avatar} src={avatarUrl} alt="" width={28} height={28} />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {name[0].toUpperCase()}
          </span>
        )}
        My Hearts
      </Link>
      <button type="button" className={styles.signOut} onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav className={styles.navbar}>
      <ul className={styles.links}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className={pathname?.startsWith(href) ? styles.active : undefined}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <Account pathname={pathname} />
    </nav>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

// The URL is only known at request time, so the links show right away and the active one lights up after
export default function Navbar() {
  return (
    <Suspense fallback={<NavLinks />}>
      <ActiveNavLinks />
    </Suspense>
  );
}

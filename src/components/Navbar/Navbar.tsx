"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@components/Favorites/FavoritesProvider";
import SearchBox from "@components/Search/SearchBox";
import { MY_MOVIES_LABEL, NAV_LINKS } from "@lib/navigation";
import styles from "./Navbar.module.css";

type AccountProps = {
  pathname?: string;
  // Closes the mobile menu after a tap
  onNavigate?: () => void;
};

function Account({ pathname, onNavigate }: AccountProps) {
  const { user, signOut } = useFavorites();

  if (!user) {
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/login${next}`} className={styles.signIn} onClick={onNavigate}>
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
        onClick={onNavigate}
      >
        {avatarUrl ? (
          <Image className={styles.avatar} src={avatarUrl} alt="" width={28} height={28} />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {name[0].toUpperCase()}
          </span>
        )}
        {MY_MOVIES_LABEL}
      </Link>
      <button
        type="button"
        className={styles.signOut}
        onClick={() => {
          onNavigate?.();
          signOut();
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function NavLinks({ pathname }: { pathname?: string }) {
  // The ☰ menu on small screens
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => setMenuOpen(false);

  // Escape or a tap outside the bar closes the menu
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!navRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const links = NAV_LINKS.map(({ href, label }) => (
    <li key={href}>
      <Link
        href={href}
        className={pathname?.startsWith(href) ? styles.active : undefined}
        aria-current={pathname?.startsWith(href) ? "page" : undefined}
        onClick={close}
      >
        {label}
      </Link>
    </li>
  ));

  return (
    <nav ref={navRef} className={styles.navbar}>
      <Link
        href="/home"
        className={styles.logoLink}
        aria-label="Nicks House of Horrors home"
        onClick={close}
      >
        <Image
          className={styles.logo}
          src="/assets/gore-instagram.svg"
          alt=""
          width={44}
          height={44}
          loading="eager"
        />
      </Link>

      {/* Wide screens: everything in one row */}
      <ul className={styles.links}>{links}</ul>
      <SearchBox />
      <div className={styles.desktopAccount}>
        <Account pathname={pathname} />
      </div>

      {/* Small screens: the links and account fold into a menu */}
      <button
        ref={toggleRef}
        type="button"
        className={styles.menuButton}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </span>
      </button>

      <div id="mobile-menu" className={styles.menu} hidden={!menuOpen}>
        <ul className={styles.menuLinks}>{links}</ul>
        <div className={styles.menuAccount}>
          <Account pathname={pathname} onNavigate={close} />
        </div>
      </div>
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

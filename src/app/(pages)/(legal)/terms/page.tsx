import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@lib/site";
import {
  EXTRA_LIST_PRICE_CENTS,
  FIRST_LIST_PRICE_CENTS,
  FIRST_LIST_PROMO_DAYS,
  formatPrice,
  PROMOTE_DAYS,
  PROMOTE_PRICE_CENTS,
} from "@lib/userListShared";
import LegalPage, { Contact } from "../LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The rules for using ${SITE_NAME}, including paid Top 10 lists and promotions.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        Welcome to {SITE_NAME} (&ldquo;the site&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a
        horror movie fan site run by Nick in Colorado, USA. By using the site you agree to these
        terms. If you don&apos;t agree, please don&apos;t use it.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You sign in with Google or an email link. You must be at least 13 years old.</li>
        <li>
          Your username is public. Pick one that isn&apos;t offensive and doesn&apos;t pretend to be
          someone else.
        </li>
        <li>You&apos;re responsible for what happens on your account.</li>
      </ul>

      <h2>What you post</h2>
      <p>
        Comments, Top 10 lists, votes and usernames are public. Keep it about the movies: no
        harassment, hate, spam, illegal content, or spoilers dressed up as something else. You keep
        ownership of what you write, and you let us show it on the site. We can remove anything that
        breaks these rules and suspend accounts that keep doing it.
      </p>

      <h2>Paid Top 10 lists and promotions</h2>
      <ul>
        <li>
          <strong>Your first Top 10 list costs {formatPrice(FIRST_LIST_PRICE_CENTS)}</strong> and
          includes {FIRST_LIST_PROMO_DAYS} days in a promoted spot at the top of The Lists, starting
          when you publish it. Each list after that costs {formatPrice(EXTRA_LIST_PRICE_CENTS)}.
        </li>
        <li>
          <strong>Promoting</strong> a published list costs {formatPrice(PROMOTE_PRICE_CENTS)} for{" "}
          {PROMOTE_DAYS} days. There are two promoted spots. If both are taken, your days wait in
          line and start as soon as a spot opens, and you always get the full time.
        </li>
        <li>
          <strong>Published lists are final.</strong> You can edit a list as much as you like before
          publishing, but not after. Want changes? Make a new list.
        </li>
        <li>
          Prices are in US dollars and may change, but never for something you&apos;ve already paid
          for. Payments are processed by Stripe, see the <Link href="/privacy">Privacy Policy</Link>
          .
        </li>
        <li>
          A list that breaks these rules can be removed without a refund. Refunds otherwise follow
          the <Link href="/refunds">Refund Policy</Link>.
        </li>
      </ul>

      <h2>Movie information</h2>
      <p>
        Movie details and images come from TMDB, and streaming information from Watchmode. We
        don&apos;t control that data and can&apos;t promise it&apos;s always right or up to date.
        Quiz answers are our best effort too.
      </p>

      <h2>No guarantees</h2>
      <p>
        The site is provided as it is. We work to keep it running, but it may sometimes be down,
        slow, or have bugs. As far as the law allows, we aren&apos;t liable for indirect losses, and
        our total liability to you is limited to what you paid us in the last 12 months.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to
        use the site means you accept it. These terms are governed by the laws of Colorado, USA.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Reach us through <Contact />.
      </p>
    </LegalPage>
  );
}

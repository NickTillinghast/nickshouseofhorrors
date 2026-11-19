import type { Metadata } from "next";
import { SITE_NAME } from "@lib/site";
import LegalPage, { Contact } from "../LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What ${SITE_NAME} collects, why, and who it's shared with.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {SITE_NAME} collects as little as it can. There are no ads, no ad trackers and no analytics.
        Here&apos;s everything we keep and why.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your sign-in:</strong> your email address, and if you use Google, the name and
          profile photo Google shares. Used to sign you in and show your profile.
        </li>
        <li>
          <strong>What you do on the site:</strong> your username, hearted movies, comments, Top 10
          lists, battle votes and quiz scores. Your username, comments, lists and scores are public;
          your hearts and individual votes are not.
        </li>
        <li>
          <strong>Purchases:</strong> what you bought, the amount, the date, and Stripe&apos;s
          reference number. Your card details go straight to Stripe and never reach us.
        </li>
        <li>
          <strong>Cookies:</strong> only the ones that keep you signed in. The quiz also saves your
          last game in your browser so you can save its score after signing in.
        </li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We never sell your information. These services run parts of the site for us:</p>
      <ul>
        <li>
          <strong>Supabase</strong> stores accounts and site data.
        </li>
        <li>
          <strong>Stripe</strong> processes payments and sends your receipt.
        </li>
        <li>
          <strong>Amazon Web Services</strong> hosts the site.
        </li>
        <li>
          <strong>Google</strong>, only if you choose to sign in with Google.
        </li>
      </ul>
      <p>
        Movie data comes from TMDB and Watchmode, but we don&apos;t send them anything about you.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your account until you ask us to delete it. To see, correct or delete your data,
        contact us through <Contact />. Deleting your account removes your profile, hearts,
        comments, votes and lists. We keep purchase records as long as tax law requires.
      </p>

      <h2>Children</h2>
      <p>
        The site isn&apos;t for anyone under 13, and we don&apos;t knowingly collect their data.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, we&apos;ll update the date at the top.</p>
    </LegalPage>
  );
}

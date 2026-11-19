import type { Metadata } from "next";
import { SITE_NAME } from "@lib/site";
import LegalPage, { Contact } from "../LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refunds for Top 10 lists and promotions on ${SITE_NAME}.`,
  alternates: { canonical: "/refunds" },
};

// How long after buying an unpublished list can be refunded
const REFUND_WINDOW_DAYS = 14;

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <p>Fair and simple. If something went wrong, tell us and we&apos;ll make it right.</p>

      <h2>You can get a full refund for</h2>
      <ul>
        <li>
          <strong>A list you haven&apos;t published yet</strong>, within {REFUND_WINDOW_DAYS} days
          of buying it.
        </li>
        <li>
          <strong>A promotion that hasn&apos;t started yet</strong> (it&apos;s still waiting for a
          spot).
        </li>
        <li>
          <strong>A mistake</strong>: charged twice, charged the wrong amount, or you paid and
          didn&apos;t get your list or promotion.
        </li>
      </ul>

      <h2>No refunds for</h2>
      <ul>
        <li>
          <strong>Published lists.</strong> Publishing is final, since your list is already up for
          everyone to see.
        </li>
        <li>
          <strong>Promotions that have started.</strong>
        </li>
        <li>
          <strong>Lists removed for breaking the rules</strong> in our Terms of Service.
        </li>
      </ul>

      <h2>How to ask</h2>
      <p>
        Contact us through <Contact /> with the email you paid with and what happened. Refunds go
        back to the card you paid with, usually within 5 to 10 business days. A refunded list or
        promotion is removed from the site.
      </p>

      <h2>Disputes</h2>
      <p>
        Please talk to us before disputing a charge with your bank. It&apos;s faster for you, and a
        disputed list is removed from the site while the dispute is open.
      </p>
    </LegalPage>
  );
}

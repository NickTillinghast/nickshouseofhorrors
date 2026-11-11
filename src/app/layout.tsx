import type { Metadata } from "next";
import { fontVariables } from "@lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // Turns relative URLs (canonical links, share images) into full ones
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Horror Movies, Where to Watch & Random Picks`,
    // Each page sets its own title, e.g. "The Shining (1980) | Nicks House of Horrors"
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}

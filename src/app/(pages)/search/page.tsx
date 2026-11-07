import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  // Search results pages shouldn't show up in Google
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <main>
      <h1>Search</h1>
    </main>
  );
}

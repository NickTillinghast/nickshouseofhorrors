import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  // TODO: remove once the page has real content, thin pages hurt the whole site in search
  robots: { index: false },
};

export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page.</p>
    </div>
  );
}

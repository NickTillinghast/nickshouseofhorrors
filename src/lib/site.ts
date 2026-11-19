// Used for canonical links, the sitemap, sign-in redirects and social share previews.
// Set as NEXT_PUBLIC_SITE_URL on AWS (https://nickshouseofhorrors.com)
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Nicks House of Horrors";

// Where fans reach Nick about refunds, privacy and account questions (shown on the legal pages).
// Empty shows the Instagram link instead. TODO: set a real inbox before taking payments
export const CONTACT_EMAIL = "nickshouseofhorrors@gmail.com";

export const SITE_DESCRIPTION =
  "Find your next horror movie. Browse horror by subgenre, see where to stream it, spin the reel for a random pick, and save the ones that haunt you.";

// Meta keywords. Google ignores these, Bing gives them a little weight, they never hurt.
// What actually ranks a page is its title, description, headings and content
export const SITE_KEYWORDS = [
  "horror movies",
  "best horror movies",
  "where to stream horror movies",
  "horror movies to watch",
  "horror movie recommendations",
  "random horror movie picker",
  "horror subgenres",
  "slasher movies",
  "folk horror",
  "found footage horror",
  "horror movie trivia",
  "top 10 horror movies",
];

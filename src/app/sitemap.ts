import type { MetadataRoute } from "next";
import { getHorrorMovies, getPopularHorrorMovies, getTopRatedHorrorMovies } from "../lib/tmdb";
import { SITE_URL } from "../lib/site";
import { getFeaturedList, getPublishedLists } from "../lib/userLists";

// How many A–Z pages of the movie feed to list, 20 movies each
const FEED_PAGES = 10;

// Lists every page we want in search results, so Google finds movie pages
// even ones no link points to yet. Built from cached TMDB calls
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [featured, fanLists, popular, topRated, ...feedPages] = await Promise.all([
    getFeaturedList(),
    getPublishedLists(),
    getPopularHorrorMovies(50),
    getTopRatedHorrorMovies(20),
    ...Array.from({ length: FEED_PAGES }, (_, i) => getHorrorMovies(i + 1)),
  ]);

  const movieIds = new Set(
    [...popular, ...topRated, ...feedPages.flatMap((page) => page.movies)]
      .map((movie) => movie.id)
      .filter((id) => id !== undefined),
  );

  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/home`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/movies`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/quiz`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/gear`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/lists`, changeFrequency: "daily", priority: 0.8 },
    ...[...(featured ? [featured] : []), ...fanLists].map((list) => ({
      url: `${SITE_URL}/lists/${list.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...[...movieIds].map((id) => ({
      url: `${SITE_URL}/movies/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

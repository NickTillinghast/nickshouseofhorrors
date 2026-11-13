import horrorFilters from "@data/horrorFilters.json";

// Horror subgenres (TMDB keyword ids), A to Z. Shared by the /movies filter, its
// search-engine titles and the sitemap, so they all say the same thing
export const SUBGENRES = [...horrorFilters.subgenres].sort((a, b) => a.name.localeCompare(b.name));

export type Subgenre = (typeof SUBGENRES)[number];

// Only ids from our list count, anything else means "all horror"
export function findSubgenre(id: unknown): Subgenre | undefined {
  return SUBGENRES.find((subgenre) => subgenre.id === Number(id));
}

export function subgenreHref(subgenre: Subgenre) {
  return `/movies?subgenre=${subgenre.id}`;
}

// "Slasher" → "Slasher Movies", "Folk Horror" → "Folk Horror Movies"
export function subgenreHeading(subgenre: Subgenre) {
  return `${subgenre.name} Movies`;
}

// Written for search results: what people type, plus why to click
export function subgenreTitle(subgenre: Subgenre) {
  return `Best ${subgenre.name} Movies & Where to Stream Them`;
}

export function subgenreDescription(subgenre: Subgenre) {
  return `Browse the best ${subgenre.name.toLowerCase()} movies, top rated first, and find out where to stream each one. Every pick is horror, A to Z.`;
}

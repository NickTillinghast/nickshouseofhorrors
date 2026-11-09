// Featured lists on /lists. When someone sends in their favorites, fill in a slot:
// put their name in `curator` and the TMDB ids in `movieIds`, in rank order
// (the id is the number in a movie's URL, e.g. /movies/694 is The Shining).
export type FeaturedList = {
  title: string;
  curator: string | null;
  description: string;
  movieIds: number[];
};

export const FEATURED_LISTS: FeaturedList[] = [
  {
    title: "List #1",
    curator: null,
    description: "A fan's favorite horror movies",
    movieIds: [],
  },
  {
    title: "List #2",
    curator: null,
    description: "A fan's favorite horror movies",
    movieIds: [],
  },
  {
    title: "List #3",
    curator: null,
    description: "A fan's favorite horror movies",
    movieIds: [],
  },
  {
    title: "List #4",
    curator: null,
    description: "A fan's favorite horror movies",
    movieIds: [],
  },
];

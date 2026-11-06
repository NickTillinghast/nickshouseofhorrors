import { MovieDb } from "moviedb-promise";

const moviedb = new MovieDb(process.env.TMDB_API_KEY!);

const HORROR_GENRE_ID = "27";

// GET /api/movies?type=movie|person|keywords|genre|genres|details&name=...&page=...&id=...&genre=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "movie";
  const name = searchParams.get("name") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  try {
    if (type === "details") {
      const id = searchParams.get("id");
      if (!id) {
        return Response.json({ error: "Missing movie id" }, { status: 400 });
      }
      const res = await moviedb.movieInfo({ id });
      return Response.json(res);
    }

    if (type === "genres") {
      const res = await moviedb.genreMovieList();
      console.log(JSON.stringify(res.genres, null, 2));
      return Response.json(res.genres);
    }

    if (type === "genre") {
      const genre = searchParams.get("genre") ?? HORROR_GENRE_ID;
      const res = await moviedb.discoverMovie({ with_genres: genre, page });
      console.log(JSON.stringify(res.results?.slice(0, 2), null, 2));
      return Response.json(res.results);
    }

    if (type === "person") {
      const res = await moviedb.searchPerson({ query: name, page });
      return Response.json(res.results);
    }

    if (type === "keywords") {
      const id = searchParams.get("id");
      if (!id) {
        return Response.json({ error: "Missing movie id" }, { status: 400 });
      }
      const res = await moviedb.movieKeywords({ id });
      return Response.json(res.keywords);
    }

    const res = await moviedb.searchMovie({ query: name, page });
    return Response.json(res.results);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

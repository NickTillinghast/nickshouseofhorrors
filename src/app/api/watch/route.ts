import { getWatchSources } from "../../../lib/watchmode";

// GET /api/watch?id=<tmdb movie id>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ error: "Missing or invalid movie id" }, { status: 400 });
  }

  try {
    return Response.json(await getWatchSources(id));
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

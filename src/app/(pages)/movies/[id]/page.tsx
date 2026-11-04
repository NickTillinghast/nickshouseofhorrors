export default async function MovieDetailPage(props: PageProps<"/movies/[id]">) {
  const { id } = await props.params;

  return (
    <main>
      <h1>Movie {id}</h1>
    </main>
  );
}

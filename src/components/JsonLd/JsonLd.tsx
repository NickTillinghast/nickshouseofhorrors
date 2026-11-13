// Structured data search engines read (schema.org JSON-LD). "<" is escaped so text from
// TMDB or a fan's list title can never close the script tag
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

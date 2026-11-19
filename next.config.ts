import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server (.next/standalone) for the Docker image that runs on AWS Lambda.
  // The deployment id comes from the NEXT_DEPLOYMENT_ID env var at build time (the git commit),
  // so a tab left open across a deploy reloads cleanly instead of breaking
  output: "standalone",
  // "use cache" results are shared across Lambda copies through DynamoDB.
  // Memory only locally and during the build (see cache-handler.mjs)
  cacheHandlers: {
    default: require.resolve("./cache-handler.mjs"),
  },
  images: {
    remotePatterns: [
      new URL("https://image.tmdb.org/t/p/**"),
      // Google profile photos for signed-in users
      new URL("https://lh3.googleusercontent.com/**"),
    ],
  },
  experimental: {
    agentFeedback: true,
    // Behind CloudFront the server sees its own address, these are the real ones
    serverActions: {
      allowedOrigins: ["nickshouseofhorrors.com", "www.nickshouseofhorrors.com"],
    },
    // Lambda's disk is read-only, so keep refreshed pages in memory instead of writing them
    isrFlushToDisk: false,
  },
  // The old splash page is gone, the home page is the front door.
  // Temporary (307), so a splash page could come back later without browsers remembering this
  async redirects() {
    return [{ source: "/", destination: "/home", permanent: false }];
  },
  // Next's default list plus Googlebot. Next normally streams page titles and canonical links
  // into the <body> for Googlebot, and Search Console then treated movie pages as duplicates
  // (in the raw HTML every movie page has the same empty <head>). These bots get them in <head>
  htmlLimitedBots:
    /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
};

export default nextConfig;

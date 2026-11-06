// Only allow sending people back to a page on this site, never to another domain
export function safeRedirect(path: string | null | undefined, fallback = "/home") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}

// 83456 → "1:23.4"
export function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
}

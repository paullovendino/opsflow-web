/** Reference-data lookups should not drive the global progress bar. */
export function isQuietRequestUrl(url: string): boolean {
  return url.includes('/api/v1/lookups/')
}

export function shouldTrackHttpProgress(url: string, quietProgress = false): boolean {
  if (quietProgress) return false
  return !isQuietRequestUrl(url)
}

/** First fetch: no rows yet — show skeleton, not empty state. */
export function isInitialListLoading(isLoading: boolean, itemCount: number): boolean {
  return isLoading && itemCount === 0
}

/** Refetch with existing rows — keep data visible (soft refresh). */
export function isSoftListRefresh(isLoading: boolean, itemCount: number): boolean {
  return isLoading && itemCount > 0
}

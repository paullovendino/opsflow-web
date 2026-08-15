import type { PaginationMeta } from '@/types/api'

export interface Identifiable {
  id: number
}

export function upsertById<T extends Identifiable>(items: T[], item: T): T[] {
  const index = items.findIndex((row) => row.id === item.id)
  if (index === -1) {
    return [item, ...items]
  }

  const next = items.slice()
  next[index] = item
  return next
}

export function removeById<T extends Identifiable>(items: T[], id: number): T[] {
  return items.filter((row) => row.id !== id)
}

export function matchesTextQuery(
  query: string,
  ...values: Array<string | null | undefined>
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }

  return values.some((value) => (value ?? '').toLowerCase().includes(needle))
}

function bumpMetaTotal(meta: PaginationMeta, delta: number): PaginationMeta {
  const total = Math.max(0, meta.total + delta)
  const perPage = Math.max(1, meta.per_page)
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(meta.current_page, lastPage)

  let from = meta.from
  let to = meta.to

  if (total === 0) {
    from = null
    to = null
  } else if (from != null && to != null) {
    to = Math.min(total, Math.max(from - 1, to + delta))
    if (to < from) {
      to = from
    }
  }

  return {
    ...meta,
    total,
    last_page: lastPage,
    current_page: currentPage,
    from,
    to,
  }
}

export interface ReconcileUpsertOptions<T extends Identifiable> {
  items: T[]
  item: T
  matches: (item: T) => boolean
  meta: PaginationMeta | null
  /** Current list page (1-based). New matching rows are only inserted on page 1. */
  page?: number
  /** Optional sort key for inserting new rows among the current page. */
  sortKey?: (item: T) => string | number | null | undefined
  sortDirection?: 'asc' | 'desc'
}

export interface ReconcileUpsertResult<T extends Identifiable> {
  items: T[]
  meta: PaginationMeta | null
}

/**
 * Apply a server-confirmed create/update into the current filtered page.
 * Respects active filters: non-matching rows are removed; matching updates replace in place.
 * New matching rows are inserted only on page 1 (sorted when sortKey is provided).
 */
export function reconcileUpsertItem<T extends Identifiable>(
  options: ReconcileUpsertOptions<T>,
): ReconcileUpsertResult<T> {
  const page = options.page ?? 1
  const wasPresent = options.items.some((row) => row.id === options.item.id)
  const doesMatch = options.matches(options.item)

  if (!doesMatch) {
    if (!wasPresent) {
      return { items: options.items, meta: options.meta }
    }

    return {
      items: removeById(options.items, options.item.id),
      meta: options.meta ? bumpMetaTotal(options.meta, -1) : null,
    }
  }

  if (wasPresent) {
    return {
      items: upsertById(options.items, options.item),
      meta: options.meta,
    }
  }

  // Newly enters the filtered set
  if (page !== 1) {
    return {
      items: options.items,
      meta: options.meta ? bumpMetaTotal(options.meta, 1) : null,
    }
  }

  let items = [...options.items, options.item]
  if (options.sortKey) {
    const direction = options.sortDirection ?? 'asc'
    items = items.slice().sort((a, b) => {
      const left = String(options.sortKey?.(a) ?? '')
      const right = String(options.sortKey?.(b) ?? '')
      const cmp = left.localeCompare(right, undefined, { sensitivity: 'base' })
      return direction === 'asc' ? cmp : -cmp
    })
  } else {
    items = [options.item, ...options.items]
  }

  const perPage = options.meta?.per_page ?? items.length
  if (perPage > 0 && items.length > perPage) {
    items = items.slice(0, perPage)
  }

  return {
    items,
    meta: options.meta ? bumpMetaTotal(options.meta, 1) : null,
  }
}

export interface ReconcileDeleteOptions<T extends Identifiable> {
  items: T[]
  id: number
  meta: PaginationMeta | null
}

export interface ReconcileDeleteResult<T extends Identifiable> {
  items: T[]
  meta: PaginationMeta | null
  /** True when the page is empty but other pages still have rows. */
  needsPageRecovery: boolean
}

export function reconcileDeletedItem<T extends Identifiable>(
  options: ReconcileDeleteOptions<T>,
): ReconcileDeleteResult<T> {
  const wasPresent = options.items.some((row) => row.id === options.id)
  const items = removeById(options.items, options.id)
  const meta = wasPresent && options.meta ? bumpMetaTotal(options.meta, -1) : options.meta
  const needsPageRecovery = items.length === 0 && (meta?.total ?? 0) > 0

  return { items, meta, needsPageRecovery }
}

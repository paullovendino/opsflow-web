import { describe, expect, it } from 'vitest'
import {
  matchesTextQuery,
  reconcileDeletedItem,
  reconcileUpsertItem,
  removeById,
  upsertById,
} from '@/utils/listReconcile'
import type { PaginationMeta } from '@/types/api'

const meta = (overrides: Partial<PaginationMeta> = {}): PaginationMeta => ({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 2,
  from: 1,
  to: 2,
  ...overrides,
})

describe('listReconcile', () => {
  it('upserts by id without duplicating', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    expect(upsertById(items, { id: 2, name: 'B2' })).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B2' },
    ])
    expect(upsertById(items, { id: 3, name: 'C' })).toEqual([
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])
  })

  it('removes by id', () => {
    expect(removeById([{ id: 1 }, { id: 2 }], 1)).toEqual([{ id: 2 }])
  })

  it('matches text query across fields', () => {
    expect(matchesTextQuery('eng', 'Software Engineer', 'IT')).toBe(true)
    expect(matchesTextQuery('finance', 'Software Engineer', 'IT')).toBe(false)
    expect(matchesTextQuery('', 'anything')).toBe(true)
  })

  it('removes updated item when it no longer matches filters', () => {
    const result = reconcileUpsertItem({
      items: [
        { id: 1, name: 'IT', status: 'active' },
        { id: 2, name: 'HR', status: 'active' },
      ],
      item: { id: 1, name: 'IT', status: 'inactive' },
      matches: (row) => row.status === 'active',
      meta: meta(),
      page: 1,
    })

    expect(result.items).toEqual([{ id: 2, name: 'HR', status: 'active' }])
    expect(result.meta?.total).toBe(1)
  })

  it('inserts new matching item on page 1 in sort order', () => {
    const result = reconcileUpsertItem({
      items: [
        { id: 2, name: 'Finance' },
        { id: 3, name: 'Operations' },
      ],
      item: { id: 1, name: 'Accounting' },
      matches: () => true,
      meta: meta({ total: 2, to: 2 }),
      page: 1,
      sortKey: (row) => row.name,
    })

    expect(result.items.map((row) => row.name)).toEqual(['Accounting', 'Finance', 'Operations'])
    expect(result.meta?.total).toBe(3)
  })

  it('does not insert new matching item onto page > 1', () => {
    const items = [
      { id: 2, name: 'Finance' },
      { id: 3, name: 'Operations' },
    ]
    const result = reconcileUpsertItem({
      items,
      item: { id: 1, name: 'Accounting' },
      matches: () => true,
      meta: meta({ current_page: 2, total: 17, from: 16, to: 17 }),
      page: 2,
      sortKey: (row) => row.name,
    })

    expect(result.items).toEqual(items)
    expect(result.meta?.total).toBe(18)
  })

  it('signals page recovery when delete empties a non-final page', () => {
    const result = reconcileDeletedItem({
      items: [{ id: 5, name: 'Only' }],
      id: 5,
      meta: meta({ current_page: 2, last_page: 2, total: 16, from: 16, to: 16 }),
    })

    expect(result.items).toEqual([])
    expect(result.meta?.total).toBe(15)
    expect(result.needsPageRecovery).toBe(true)
  })
})

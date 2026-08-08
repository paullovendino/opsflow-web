import { describe, expect, it } from 'vitest'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'

describe('listLoading', () => {
  it('shows skeleton only on initial load with no rows', () => {
    expect(isInitialListLoading(true, 0)).toBe(true)
    expect(isInitialListLoading(true, 3)).toBe(false)
    expect(isInitialListLoading(false, 0)).toBe(false)
  })

  it('uses soft refresh when loading with existing rows', () => {
    expect(isSoftListRefresh(true, 5)).toBe(true)
    expect(isSoftListRefresh(true, 0)).toBe(false)
    expect(isSoftListRefresh(false, 5)).toBe(false)
  })
})

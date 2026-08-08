import { describe, expect, it } from 'vitest'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'
import { authLayoutViewKey } from '@/utils/modalRoutes'

/**
 * Users Create/Edit stay on the list view. Opening Create after a loaded list
 * is a soft refresh / modal overlay, not an empty-state remount.
 */
describe('Users list+modal loading contract', () => {
  it('does not treat a loaded list as empty while a modal opens', () => {
    expect(authLayoutViewKey('users.index', '/users')).toBe('users.index')
    expect(authLayoutViewKey('users.create', '/users/create')).toBe('users.index')
    expect(authLayoutViewKey('users.edit', '/users/4/edit')).toBe('users.index')
    expect(isInitialListLoading(false, 12)).toBe(false)
    expect(isSoftListRefresh(true, 12)).toBe(true)
  })
})

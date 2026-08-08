import { describe, expect, it } from 'vitest'
import {
  authLayoutViewKey,
  isModalAliasNavigation,
  listIndexLocation,
  modalAliasLocation,
  shouldTrackRouteProgress,
} from '@/utils/modalRoutes'

describe('isModalAliasNavigation', () => {
  it('treats users create/edit as list-family navigation', () => {
    expect(isModalAliasNavigation('users.create', 'users.index')).toBe(true)
    expect(isModalAliasNavigation('users.edit', 'users.create')).toBe(true)
    expect(isModalAliasNavigation('users.index', 'users.edit')).toBe(true)
  })

  it('treats projects and tasks create/edit as list-family navigation', () => {
    expect(isModalAliasNavigation('projects.create', 'projects.index')).toBe(true)
    expect(isModalAliasNavigation('tasks.edit', 'tasks.index')).toBe(true)
  })

  it('does not treat show or unrelated routes as modal aliases', () => {
    expect(isModalAliasNavigation('users.show', 'users.index')).toBe(false)
    expect(isModalAliasNavigation('users.create', 'projects.index')).toBe(false)
    expect(isModalAliasNavigation('dashboard', 'users.index')).toBe(false)
  })
})

describe('authLayoutViewKey', () => {
  it('keeps the same key for index, create, and edit in a family', () => {
    expect(authLayoutViewKey('users.index', '/users')).toBe('users.index')
    expect(authLayoutViewKey('users.create', '/users/create')).toBe('users.index')
    expect(authLayoutViewKey('users.edit', '/users/1/edit')).toBe('users.index')
    expect(authLayoutViewKey('projects.create', '/projects/create')).toBe('projects.index')
    expect(authLayoutViewKey('tasks.edit', '/tasks/9/edit')).toBe('tasks.index')
  })

  it('uses the path for show and unrelated routes', () => {
    expect(authLayoutViewKey('users.show', '/users/1')).toBe('/users/1')
    expect(authLayoutViewKey('dashboard', '/dashboard')).toBe('/dashboard')
  })
})

describe('shouldTrackRouteProgress', () => {
  it('skips progress for modal alias navigation even when the path changes', () => {
    expect(shouldTrackRouteProgress('users.create', 'users.index', '/users/create', '/users')).toBe(false)
    expect(shouldTrackRouteProgress('users.index', 'users.edit', '/users', '/users/4/edit')).toBe(false)
  })

  it('tracks actual page navigation', () => {
    expect(shouldTrackRouteProgress('users.show', 'users.index', '/users/1', '/users')).toBe(true)
    expect(shouldTrackRouteProgress('dashboard', 'users.index', '/dashboard', '/users')).toBe(true)
  })
})

describe('modal query preservation', () => {
  it('keeps current list query when opening or closing a modal alias', () => {
    const query = { search: 'John', status: 'active', page: '2' }

    expect(modalAliasLocation('users.create', query)).toEqual({
      name: 'users.create',
      query,
    })
    expect(modalAliasLocation('users.edit', query, { id: 4 })).toEqual({
      name: 'users.edit',
      params: { id: 4 },
      query,
    })
    expect(listIndexLocation('users.edit', query)).toEqual({
      name: 'users.index',
      query,
    })
  })
})

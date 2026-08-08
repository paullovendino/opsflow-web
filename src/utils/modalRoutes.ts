import type { LocationQuery, RouteLocationRaw } from 'vue-router'

const familyIndexByMember: Record<string, string> = {
  'users.index': 'users.index',
  'users.create': 'users.index',
  'users.edit': 'users.index',
  'projects.index': 'projects.index',
  'projects.create': 'projects.index',
  'projects.edit': 'projects.index',
  'tasks.index': 'tasks.index',
  'tasks.create': 'tasks.index',
  'tasks.edit': 'tasks.index',
}

export function asRouteName(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function listFamilyIndexName(routeName: string): string | null {
  return familyIndexByMember[routeName] ?? null
}

/** Create/Edit aliases share the list view — not a full page navigation. */
export function isModalAliasRouteName(routeName: string): boolean {
  return routeName.endsWith('.create') || routeName.endsWith('.edit')
    ? Boolean(familyIndexByMember[routeName])
    : false
}

export function isModalAliasNavigation(toName: string, fromName: string): boolean {
  const toIndex = listFamilyIndexName(toName)
  const fromIndex = listFamilyIndexName(fromName)
  return toIndex != null && fromIndex != null && toIndex === fromIndex
}

export function shouldTrackRouteProgress(
  toName: string,
  fromName: string,
  toPath: string,
  fromPath: string,
): boolean {
  if (isModalAliasNavigation(toName, fromName)) return false
  return toPath !== fromPath
}

/**
 * Keep list views mounted for Create/Edit aliases.
 * Index, create, and edit in the same family share one key.
 */
export function authLayoutViewKey(routeName: unknown, path: string): string {
  const indexName = listFamilyIndexName(asRouteName(routeName))
  return indexName ?? path
}

/** Push/replace a modal alias without dropping current list query state. */
export function modalAliasLocation(
  name: string,
  query: LocationQuery,
  params?: Record<string, string | number>,
): RouteLocationRaw {
  return params ? { name, params, query } : { name, query }
}

export function listIndexLocation(routeName: string, query: LocationQuery): RouteLocationRaw | null {
  const name = listFamilyIndexName(routeName)
  if (!name) return null
  return { name, query }
}

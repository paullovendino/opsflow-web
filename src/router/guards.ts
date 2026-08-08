import type { Router, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

/** Modal alias routes share the list view — not a page navigation. */
function isModalAliasNavigation(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): boolean {
  const toName = typeof to.name === 'string' ? to.name : ''
  const fromName = typeof from.name === 'string' ? from.name : ''

  const usersFamily = new Set(['users.index', 'users.create', 'users.edit'])
  const projectsFamily = new Set(['projects.index', 'projects.create', 'projects.edit'])
  const tasksFamily = new Set(['tasks.index', 'tasks.create', 'tasks.edit'])

  if (usersFamily.has(toName) && usersFamily.has(fromName)) return true
  if (projectsFamily.has(toName) && projectsFamily.has(fromName)) return true
  if (tasksFamily.has(toName) && tasksFamily.has(fromName)) return true

  return false
}

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to, from) => {
    const auth = useAuthStore()
    const ui = useUiStore()

    if (to.path !== from.path && !isModalAliasNavigation(to, from)) {
      ui.setRouteLoading(true)
    }

    if (!auth.isBootstrapped) {
      await auth.bootstrap()
    }

    if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
      ui.setRouteLoading(false)
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.meta.guest === true && auth.isAuthenticated) {
      ui.setRouteLoading(false)
      return { name: 'dashboard' }
    }

    const roles = to.meta.roles
    if (roles && roles.length > 0 && auth.isAuthenticated) {
      const role = auth.roleName
      if (!role || !roles.includes(role as (typeof roles)[number])) {
        ui.setRouteLoading(false)
        return { name: 'forbidden' }
      }
    }

    return true
  })

  router.afterEach(() => {
    useUiStore().setRouteLoading(false)
  })

  router.onError(() => {
    useUiStore().setRouteLoading(false)
  })
}

import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { asRouteName, shouldTrackRouteProgress } from '@/utils/modalRoutes'

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to, from) => {
    const auth = useAuthStore()
    const ui = useUiStore()

    if (
      shouldTrackRouteProgress(
        asRouteName(to.name),
        asRouteName(from.name),
        to.path,
        from.path,
      )
    ) {
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

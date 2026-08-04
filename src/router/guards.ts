import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.isBootstrapped) {
      await auth.bootstrap()
    }

    if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.meta.guest === true && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }

    const roles = to.meta.roles
    if (roles && roles.length > 0 && auth.isAuthenticated) {
      const role = auth.roleName
      if (!role || !roles.includes(role as (typeof roles)[number])) {
        return { name: 'forbidden' }
      }
    }

    return true
  })
}

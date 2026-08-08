import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from '@/router/guards'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: { template: '<div>login</div>' }, meta: { guest: true } },
  { path: '/dashboard', name: 'dashboard', component: { template: '<div>dash</div>' }, meta: { requiresAuth: true } },
  {
    path: '/users',
    name: 'users.index',
    component: { template: '<div>users</div>' },
    meta: { requiresAuth: true, roles: ['administrator', 'project_manager'] },
  },
  {
    path: '/users/create',
    name: 'users.create',
    component: { template: '<div>create</div>' },
    meta: { requiresAuth: true, roles: ['administrator'] },
  },
  {
    path: '/reports/employees',
    name: 'reports.employees.index',
    component: { template: '<div>emp reports</div>' },
    meta: { requiresAuth: true, roles: ['administrator', 'project_manager'] },
  },
  { path: '/403', name: 'forbidden', component: { template: '<div>403</div>' } },
]

function userFor(role: 'administrator' | 'project_manager' | 'employee'): AuthUser {
  return {
    id: 1,
    first_name: 'Test',
    middle_name: null,
    last_name: 'User',
    full_name: 'Test User',
    email: 'test@opsflow.test',
    avatar: null,
    status: 'active',
    last_login_at: null,
    role: { id: 1, name: role as string, description: null },
    department: null,
    job_title: null,
  }
}

async function createGuardedRouter() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  setupRouterGuards(router)
  return { router, auth: useAuthStore() }
}

describe('router guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends guests to login with a redirect query', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.clear()
    auth.isBootstrapped = true
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/users')
  })

  it('sends authenticated guests away from /login', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('administrator'))
    auth.isBootstrapped = true
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('forbids employees from the users list', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('employee'))
    auth.isBootstrapped = true
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('forbids project managers from creating users', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('project_manager'))
    auth.isBootstrapped = true
    await router.push('/users/create')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('allows administrators to open users create', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('administrator'))
    auth.isBootstrapped = true
    await router.push('/users/create')
    expect(router.currentRoute.value.name).toBe('users.create')
  })

  it('forbids employees from employee reports list', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('employee'))
    auth.isBootstrapped = true
    await router.push('/reports/employees')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('does not start route loading for modal alias navigation', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('administrator'))
    auth.isBootstrapped = true
    await router.push({ path: '/users', query: { search: 'John', page: '2' } })

    const spy = vi.spyOn(useUiStore(), 'setRouteLoading')
    await router.push({
      name: 'users.create',
      query: router.currentRoute.value.query,
    })

    expect(router.currentRoute.value.name).toBe('users.create')
    expect(router.currentRoute.value.query).toEqual({ search: 'John', page: '2' })
    expect(spy.mock.calls.some((call) => call[0] === true)).toBe(false)
  })

  it('starts route loading for actual page navigation', async () => {
    const { router, auth } = await createGuardedRouter()
    auth.setUser(userFor('administrator'))
    auth.isBootstrapped = true
    await router.push('/users')

    const spy = vi.spyOn(useUiStore(), 'setRouteLoading')
    await router.push('/dashboard')

    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(spy).toHaveBeenCalledWith(true)
  })
})

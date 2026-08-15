import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppAccountMenu from '@/components/layout/AppAccountMenu.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}))

const user: AuthUser = {
  id: 1,
  first_name: 'Ada',
  middle_name: null,
  last_name: 'Admin',
  full_name: 'Ada Admin',
  email: 'ada@opsflow.test',
  avatar: null,
  status: 'active',
  last_login_at: null,
  role: { id: 1, name: 'administrator', description: null },
  department: null,
  job_title: null,
}

async function mountMenu(role: 'administrator' | 'employee' = 'administrator') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
      { path: '/profile', name: 'profile', component: { template: '<div>profile</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
    ],
  })
  await router.push('/dashboard')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser({
    ...user,
    role:
      role === 'administrator'
        ? { id: 1, name: 'administrator', description: null }
        : { id: 3, name: 'employee', description: null },
  })

  const wrapper = mount(AppAccountMenu, {
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  })

  return { wrapper, router }
}

describe('AppAccountMenu', () => {
  it('opens the account menu and navigates to profile', async () => {
    const { wrapper, router } = await mountMenu()

    await wrapper.get('[data-test="account-menu"]').trigger('click')
    await flushPromises()

    const profile = document.body.querySelector('[data-test="account-profile"]') as HTMLAnchorElement | null
    expect(profile).toBeTruthy()
    expect(profile?.getAttribute('href')).toBe('/profile')

    profile!.click()
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('profile')
    wrapper.unmount()
  })

  it('does not expose organization settings in the account menu', async () => {
    const { wrapper } = await mountMenu('administrator')

    await wrapper.get('[data-test="account-menu"]').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-test="account-organization"]')).toBeNull()
    wrapper.unmount()
  })

  it('logs out from the account menu', async () => {
    const { wrapper, router } = await mountMenu()

    await wrapper.get('[data-test="account-menu"]').trigger('click')
    await flushPromises()

    const logout = document.body.querySelector('[data-test="account-logout"]') as HTMLButtonElement | null
    expect(logout).toBeTruthy()
    logout!.click()
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    wrapper.unmount()
  })
})

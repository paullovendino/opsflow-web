import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@/services/notificationService', () => ({
  listNotifications: vi.fn().mockResolvedValue({
    notifications: [],
    meta: { current_page: 1, last_page: 1, per_page: 8, total: 0, from: null, to: null },
    message: 'ok',
  }),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

vi.mock('@/services/searchService', () => ({
  search: vi.fn().mockResolvedValue({
    results: { users: [], projects: [], tasks: [] },
    meta: { q: '', per_type: 5, users_returned: 0, projects_returned: 0, tasks_returned: 0 },
    message: 'ok',
  }),
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

describe('AppTopbar', () => {
  it('keeps the notification bell and account menu, without a standalone logout button', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'dashboard', component: { template: '<div />' }, meta: { title: 'Dashboard' } },
        { path: '/profile', name: 'profile', component: { template: '<div />' }, meta: { title: 'My profile' } },
        { path: '/notifications', name: 'notifications.index', component: { template: '<div />' } },
        { path: '/login', name: 'login', component: { template: '<div />' } },
      ],
    })
    await router.push('/dashboard')
    await router.isReady()

    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().setUser(user)

    const wrapper = mount(AppTopbar, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(wrapper.find('[data-test="notification-bell"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="account-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="global-search"]').exists()).toBe(true)
    expect(
      wrapper.findAll('button').some((button) => button.text().trim() === 'Logout'),
    ).toBe(false)
  })
})

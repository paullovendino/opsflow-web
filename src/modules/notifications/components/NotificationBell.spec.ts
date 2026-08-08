import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import NotificationBell from '@/modules/notifications/components/NotificationBell.vue'
import { useNotificationsStore } from '@/stores/notifications'
import type { AppNotification } from '@/types/notification'

vi.mock('@/services/notificationService', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

import * as notificationService from '@/services/notificationService'

const sample: AppNotification = {
  id: 1,
  type: 'task_assigned',
  actor: { id: 2, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  subject_type: 'task',
  subject_id: 44,
  subject: { id: 44, type: 'task', title: 'Create DB' },
  data: {
    title: 'You were assigned a task',
    message: 'Ada Admin assigned Create DB to you.',
    target_type: 'task',
    target_id: 44,
  },
  read_at: null,
  created_at: new Date().toISOString(),
}

async function mountBell() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
      { path: '/notifications', name: 'notifications.index', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(NotificationBell, {
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  })

  return { wrapper, router, store: useNotificationsStore() }
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1)
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 1, from: 1, to: 1 },
      message: 'ok',
    })
    vi.mocked(notificationService.markNotificationRead).mockResolvedValue({
      ...sample,
      read_at: new Date().toISOString(),
    })
    vi.mocked(notificationService.markAllNotificationsRead).mockResolvedValue(1)
  })

  it('shows the bell and unread badge', async () => {
    const { wrapper, store } = await mountBell()
    await store.refresh()
    await flushPromises()

    expect(wrapper.find('[data-test="notification-bell"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="notification-badge"]').text()).toBe('1')
    wrapper.unmount()
  })

  it('opens the dropdown and lists preview items', async () => {
    const { wrapper, store } = await mountBell()
    await store.refresh()
    await wrapper.get('[data-test="notification-bell"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('You were assigned a task')
    expect(document.body.querySelector('[data-test="notification-view-all"]')).toBeTruthy()
    wrapper.unmount()
  })

  it('marks all read from the dropdown', async () => {
    const { wrapper, store } = await mountBell()
    await store.refresh()
    await wrapper.get('[data-test="notification-bell"]').trigger('click')
    await flushPromises()

    const markAll = document.body.querySelector('[data-test="notification-mark-all"]') as HTMLButtonElement
    markAll.click()
    await flushPromises()

    expect(notificationService.markAllNotificationsRead).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('navigates to view all', async () => {
    const { wrapper, store, router } = await mountBell()
    await store.refresh()
    await wrapper.get('[data-test="notification-bell"]').trigger('click')
    await flushPromises()

    const viewAll = document.body.querySelector('[data-test="notification-view-all"]') as HTMLButtonElement
    viewAll.click()
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('notifications.index')
    wrapper.unmount()
  })
})

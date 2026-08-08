import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import NotificationListView from '@/modules/notifications/views/NotificationListView.vue'
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
  id: 11,
  type: 'remark_mentioned',
  actor: { id: 2, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  subject_type: 'remark',
  subject_id: 5,
  subject: null,
  data: {
    title: 'You were mentioned',
    message: 'Ada mentioned you on task Create DB.',
    target_type: 'task',
    target_id: 44,
  },
  read_at: null,
  created_at: new Date().toISOString(),
}

const meta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1,
}

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/notifications', name: 'notifications.index', component: NotificationListView },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
    ],
  })
  await router.push('/notifications')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(NotificationListView, {
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('NotificationListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1)
    vi.mocked(notificationService.markAllNotificationsRead).mockResolvedValue(1)
    vi.mocked(notificationService.markNotificationRead).mockResolvedValue({
      ...sample,
      read_at: new Date().toISOString(),
    })
  })

  it('shows a skeleton while loading', async () => {
    vi.mocked(notificationService.listNotifications).mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountPage()
    expect(wrapper.get('[aria-label="Loading notifications"]').exists()).toBe(true)
  })

  it('renders the list and unread state', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta,
      message: 'ok',
    })
    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('You were mentioned')
    expect(wrapper.text()).toContain('Unread')
    expect(wrapper.findAll('[data-test="notification-row"]')).toHaveLength(1)
  })

  it('shows empty state', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [],
      meta: { ...meta, total: 0, from: null, to: null },
      message: 'ok',
    })
    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('No notifications')
  })

  it('shows error with retry', async () => {
    vi.mocked(notificationService.listNotifications)
      .mockRejectedValueOnce({
        response: {
          status: 500,
          data: { success: false, message: 'Unable to load notifications.', data: null, errors: null, meta: null },
        },
      })
      .mockResolvedValueOnce({
        notifications: [sample],
        meta,
        message: 'ok',
      })

    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain("Couldn't load notifications")
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('You were mentioned')
  })

  it('marks all as read', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta,
      message: 'ok',
    })
    const { wrapper } = await mountPage()
    await wrapper.get('[data-test="notifications-mark-all"]').trigger('click')
    await flushPromises()
    expect(notificationService.markAllNotificationsRead).toHaveBeenCalled()
  })
})

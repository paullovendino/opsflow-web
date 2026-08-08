import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import type { AppNotification } from '@/types/notification'

vi.mock('@/services/notificationService', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
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
  created_at: '2026-08-08T02:15:00.000000Z',
}

describe('useNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    useNotificationsStore().stopPolling()
    vi.useRealTimers()
  })

  it('refreshes unread count and preview', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(2)
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 1, from: 1, to: 1 },
      message: 'ok',
    })

    const store = useNotificationsStore()
    await store.refresh()

    expect(store.unreadCount).toBe(2)
    expect(store.preview).toEqual([sample])
    expect(store.hasUnread).toBe(true)
  })

  it('marks one notification read and rolls back on failure', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1)
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 1, from: 1, to: 1 },
      message: 'ok',
    })
    vi.mocked(notificationService.markNotificationRead).mockRejectedValue(new Error('fail'))

    const store = useNotificationsStore()
    await store.refresh()

    await expect(store.markRead(1)).rejects.toThrow('fail')
    expect(store.preview[0]?.read_at).toBeNull()
    expect(store.unreadCount).toBe(1)
  })

  it('marks all read', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1)
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 1, from: 1, to: 1 },
      message: 'ok',
    })
    vi.mocked(notificationService.markAllNotificationsRead).mockResolvedValue(1)

    const store = useNotificationsStore()
    await store.refresh()
    await store.markAllRead()

    expect(store.unreadCount).toBe(0)
    expect(store.preview[0]?.read_at).toBeTruthy()
  })

  it('starts a single polling interval and refreshes on focus after cooldown', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0)
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [],
      meta: { current_page: 1, last_page: 1, per_page: 8, total: 0, from: null, to: null },
      message: 'ok',
    })

    const store = useNotificationsStore()
    store.startPolling()
    store.startPolling()
    await Promise.resolve()
    await Promise.resolve()

    expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(notificationService.getUnreadCount.mock.calls.length).toBeGreaterThanOrEqual(2)

    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('focus'))
    await Promise.resolve()
    await Promise.resolve()

    store.stopPolling()
  })
})

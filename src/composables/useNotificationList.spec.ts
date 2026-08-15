import { describe, expect, it, vi } from 'vitest'
import { useNotificationList } from '@/composables/useNotificationList'
import type { AppNotification } from '@/types/notification'

vi.mock('@/services/notificationService', () => ({
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

import * as notificationService from '@/services/notificationService'

const sample: AppNotification = {
  id: 3,
  type: 'project_member_added',
  actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  subject_type: 'project',
  subject_id: 9,
  subject: { id: 9, type: 'project', name: 'Alpha' },
  data: { title: 'Added to a project', message: 'Welcome', target_type: 'project', target_id: 9 },
  read_at: null,
  created_at: '2026-08-08T02:15:00.000000Z',
}

const meta = {
  current_page: 1,
  last_page: 2,
  per_page: 15,
  total: 16,
  from: 1,
  to: 15,
}

describe('useNotificationList', () => {
  it('loads paginated notifications quietly', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta,
      message: 'ok',
    })

    const list = useNotificationList()
    await list.load()

    expect(notificationService.listNotifications).toHaveBeenCalledWith(
      { unread: undefined, page: 1, per_page: 15 },
      { quietProgress: true },
    )
    expect(list.notifications.value).toHaveLength(1)
    expect(list.isEmpty.value).toBe(false)
  })

  it('retries after an error', async () => {
    vi.mocked(notificationService.listNotifications)
      .mockRejectedValueOnce({
        response: { status: 500, data: { success: false, message: 'Boom', data: null, errors: null, meta: null } },
      })
      .mockResolvedValueOnce({
        notifications: [sample],
        meta,
        message: 'ok',
      })

    const list = useNotificationList()
    await list.load()
    expect(list.errorMessage.value).toBeTruthy()

    await list.retry()
    expect(list.notifications.value).toHaveLength(1)
  })

  it('marks one notification read in place', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta,
      message: 'ok',
    })
    vi.mocked(notificationService.markNotificationRead).mockResolvedValue({
      ...sample,
      read_at: '2026-08-08T03:00:00.000000Z',
    })

    const list = useNotificationList()
    await list.load()
    await list.markRead(3)

    expect(list.notifications.value[0]?.read_at).toBe('2026-08-08T03:00:00.000000Z')
  })

  it('removes a notification from the unread-only list after mark read', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { ...meta, last_page: 1, total: 1, to: 1 },
      message: 'ok',
    })
    vi.mocked(notificationService.markNotificationRead).mockResolvedValue({
      ...sample,
      read_at: '2026-08-08T03:00:00.000000Z',
    })

    const list = useNotificationList()
    await list.setUnreadOnly(true)
    vi.mocked(notificationService.listNotifications).mockClear()
    await list.markRead(3)

    expect(list.notifications.value).toEqual([])
    expect(notificationService.listNotifications).not.toHaveBeenCalled()
  })

  it('clears the unread-only list after mark all read without refetch', async () => {
    vi.mocked(notificationService.listNotifications).mockResolvedValue({
      notifications: [sample],
      meta: { ...meta, last_page: 1, total: 1, to: 1 },
      message: 'ok',
    })
    vi.mocked(notificationService.markAllNotificationsRead).mockResolvedValue()

    const list = useNotificationList()
    await list.setUnreadOnly(true)
    vi.mocked(notificationService.listNotifications).mockClear()
    await list.markAllRead()

    expect(list.notifications.value).toEqual([])
    expect(list.meta.value?.total).toBe(0)
    expect(notificationService.listNotifications).not.toHaveBeenCalled()
  })
})

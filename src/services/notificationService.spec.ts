import { beforeEach, describe, expect, it, vi } from 'vitest'
import http from '@/services/http'
import * as notificationService from '@/services/notificationService'

vi.mock('@/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists notifications quietly by default', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [{ id: 1, type: 'task_assigned' }],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
      },
    })

    const result = await notificationService.listNotifications({ unread: true, page: 1 })

    expect(http.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { unread: 1, page: 1 },
      quietProgress: true,
    })
    expect(result.notifications).toHaveLength(1)
  })

  it('fetches unread count', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { success: true, message: 'ok', data: { unread_count: 4 }, meta: null },
    })

    await expect(notificationService.getUnreadCount()).resolves.toBe(4)
    expect(http.get).toHaveBeenCalledWith('/api/v1/notifications/unread-count', {
      quietProgress: true,
    })
  })

  it('marks one and all notifications read', async () => {
    vi.mocked(http.patch).mockResolvedValue({
      data: { success: true, message: 'ok', data: { id: 9, read_at: 'now' }, meta: null },
    })
    vi.mocked(http.post).mockResolvedValue({
      data: { success: true, message: 'ok', data: { updated_count: 3 }, meta: null },
    })

    await notificationService.markNotificationRead(9)
    await expect(notificationService.markAllNotificationsRead()).resolves.toBe(3)

    expect(http.patch).toHaveBeenCalledWith(
      '/api/v1/notifications/9/read',
      {},
      { quietProgress: true },
    )
    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/notifications/read-all',
      {},
      { quietProgress: true },
    )
  })
})

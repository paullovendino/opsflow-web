import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActivityLog } from '@/types/activity'

vi.mock('@/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

import http from '@/services/http'
import * as activityLogService from '@/services/activityLogService'

const log: ActivityLog = {
  id: 1,
  action: 'user.created',
  description: 'Created user Jane Doe.',
  subject_type: 'user',
  subject_id: 4,
  subject: { id: 4, type: 'user', full_name: 'Jane Doe' },
  actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  properties: { email: 'jane@opsflow.test' },
  created_at: '2026-08-08T02:15:00.000000Z',
}

describe('activityLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(http.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Activity logs retrieved successfully.',
        data: [log],
        errors: null,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 15,
          total: 1,
          from: 1,
          to: 1,
        },
      },
    })
  })

  it('lists global activity without quiet progress by default', async () => {
    const result = await activityLogService.listActivityLogs({
      action: 'user.created',
      page: 2,
    })

    expect(http.get).toHaveBeenCalledWith('/api/v1/activity-logs', {
      params: { action: 'user.created', page: 2 },
      quietProgress: false,
    })
    expect(result.logs).toEqual([log])
    expect(result.meta.total).toBe(1)
  })

  it('lists nested timelines quietly by default', async () => {
    await activityLogService.listProjectActivityLogs(3)
    await activityLogService.listTaskActivityLogs(42)
    await activityLogService.listUserActivityLogs(9)

    expect(http.get).toHaveBeenNthCalledWith(1, '/api/v1/projects/3/activity-logs', {
      params: {},
      quietProgress: true,
    })
    expect(http.get).toHaveBeenNthCalledWith(2, '/api/v1/tasks/42/activity-logs', {
      params: {},
      quietProgress: true,
    })
    expect(http.get).toHaveBeenNthCalledWith(3, '/api/v1/users/9/activity-logs', {
      params: {},
      quietProgress: true,
    })
  })
})

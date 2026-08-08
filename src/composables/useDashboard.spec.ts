import { describe, expect, it, vi } from 'vitest'
import { useDashboard } from '@/composables/useDashboard'
import type { DashboardSummary } from '@/types/dashboard'

vi.mock('@/services/dashboardService', () => ({
  getSummary: vi.fn(),
}))

import * as dashboardService from '@/services/dashboardService'

const summary: DashboardSummary = {
  projects: { total: 2, by_status: { active: 2 } },
  tasks: {
    total: 0,
    by_status: {},
    by_priority: {},
    overdue: 0,
    assigned_to_me: 0,
  },
  recent: [],
}

describe('useDashboard', () => {
  it('treats empty recent as distinct from zero stats', async () => {
    vi.mocked(dashboardService.getSummary).mockResolvedValue(summary)
    const dashboard = useDashboard()

    await dashboard.load()

    expect(dashboard.summary.value?.projects.total).toBe(2)
    expect(dashboard.summary.value?.tasks.total).toBe(0)
    expect(dashboard.isEmptyRecent.value).toBe(true)
  })

  it('keeps a snapshot on refresh failure', async () => {
    vi.mocked(dashboardService.getSummary)
      .mockResolvedValueOnce(summary)
      .mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Unable to load the dashboard.',
            data: null,
            errors: null,
            meta: null,
          },
        },
      })

    const dashboard = useDashboard()
    await dashboard.load()
    await dashboard.retry()

    expect(dashboard.summary.value?.projects.total).toBe(2)
    expect(dashboard.errorMessage.value).toBe('Unable to load the dashboard.')
  })
})

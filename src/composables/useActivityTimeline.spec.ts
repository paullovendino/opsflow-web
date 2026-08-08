import { describe, expect, it, vi } from 'vitest'
import { useActivityTimeline } from '@/composables/useActivityTimeline'
import type { ActivityLog } from '@/types/activity'

vi.mock('@/services/activityLogService', () => ({
  listActivityLogs: vi.fn(),
  listProjectActivityLogs: vi.fn(),
  listTaskActivityLogs: vi.fn(),
  listUserActivityLogs: vi.fn(),
}))

import * as activityLogService from '@/services/activityLogService'

const sampleLog: ActivityLog = {
  id: 11,
  action: 'project.created',
  description: 'Created project Website Redesign.',
  subject_type: 'project',
  subject_id: 3,
  subject: { id: 3, type: 'project', name: 'Website Redesign' },
  actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  properties: { status: 'planning' },
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

describe('useActivityTimeline', () => {
  it('loads global activity through the activity service', async () => {
    vi.mocked(activityLogService.listActivityLogs).mockResolvedValue({
      logs: [sampleLog],
      meta,
      message: 'Activity logs retrieved successfully.',
    })

    const timeline = useActivityTimeline({ type: 'global' }, { quiet: false })
    await timeline.load()

    expect(activityLogService.listActivityLogs).toHaveBeenCalledWith(
      { page: 1, per_page: 15 },
      { quietProgress: false },
    )
    expect(timeline.logs.value).toEqual([sampleLog])
    expect(timeline.isEmpty.value).toBe(false)
    expect(timeline.errorMessage.value).toBeNull()
  })

  it('loads nested project activity quietly', async () => {
    vi.mocked(activityLogService.listProjectActivityLogs).mockResolvedValue({
      logs: [sampleLog],
      meta,
      message: 'Activity logs retrieved successfully.',
    })

    const timeline = useActivityTimeline({ type: 'project', id: 3 }, { perPage: 10 })
    await timeline.load()

    expect(activityLogService.listProjectActivityLogs).toHaveBeenCalledWith(
      3,
      { page: 1, per_page: 10 },
      { quietProgress: true },
    )
  })

  it('is not empty while the initial request is in flight', async () => {
    let resolveList!: (value: {
      logs: ActivityLog[]
      meta: typeof meta
      message: string
    }) => void
    vi.mocked(activityLogService.listActivityLogs).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    const timeline = useActivityTimeline({ type: 'global' })
    const pending = timeline.load()

    expect(timeline.isLoading.value).toBe(true)
    expect(timeline.isEmpty.value).toBe(false)

    resolveList({ logs: [], meta: { ...meta, total: 0, from: null, to: null }, message: 'ok' })
    await pending

    expect(timeline.isEmpty.value).toBe(true)
  })

  it('keeps existing rows on refresh failure', async () => {
    vi.mocked(activityLogService.listActivityLogs)
      .mockResolvedValueOnce({
        logs: [sampleLog],
        meta,
        message: 'ok',
      })
      .mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Unable to load activity.',
            data: null,
            errors: null,
            meta: null,
          },
        },
      })

    const timeline = useActivityTimeline({ type: 'global' })
    await timeline.load()
    await timeline.retry()

    expect(timeline.logs.value).toEqual([sampleLog])
    expect(timeline.errorMessage.value).toBe('Unable to load activity.')
  })

  it('paginates with the requested page', async () => {
    vi.mocked(activityLogService.listActivityLogs).mockResolvedValue({
      logs: [sampleLog],
      meta: { ...meta, current_page: 2 },
      message: 'ok',
    })

    const timeline = useActivityTimeline({ type: 'global' }, { quiet: false })
    await timeline.setPage(2)

    expect(activityLogService.listActivityLogs).toHaveBeenCalledWith(
      { page: 2, per_page: 15 },
      { quietProgress: false },
    )
  })
})

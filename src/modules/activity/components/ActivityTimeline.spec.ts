import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ActivityTimeline from '@/modules/activity/components/ActivityTimeline.vue'
import type { ActivityLog } from '@/types/activity'

vi.mock('@/services/activityLogService', () => ({
  listActivityLogs: vi.fn(),
  listProjectActivityLogs: vi.fn(),
  listTaskActivityLogs: vi.fn(),
  listUserActivityLogs: vi.fn(),
}))

import * as activityLogService from '@/services/activityLogService'

const sampleLog: ActivityLog = {
  id: 7,
  action: 'task.assigned',
  description: 'Assigned task Draft API spec to Maria Lopez.',
  subject_type: 'task',
  subject_id: 42,
  subject: { id: 42, type: 'task', title: 'Draft API spec' },
  actor: { id: 1, full_name: 'John Reyes', email: 'john@opsflow.test' },
  properties: {
    before: { assigned_to: null },
    after: { assigned_to: 4 },
  },
  created_at: '2026-08-08T02:15:00.000000Z',
}

const meta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 1,
  from: 1,
  to: 1,
}

describe('ActivityTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a readable timeline entry', async () => {
    vi.mocked(activityLogService.listProjectActivityLogs).mockResolvedValue({
      logs: [sampleLog],
      meta,
      message: 'ok',
    })

    const wrapper = mount(ActivityTimeline, {
      props: {
        source: { type: 'project', id: 3 },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('John Reyes assigned task Draft API spec to Maria Lopez')
    expect(wrapper.text()).toContain('Draft API spec')
    expect(wrapper.text()).toContain('Task assigned')
    expect(wrapper.text()).not.toContain('"assigned_to"')
    expect(wrapper.findAll('[data-test="activity-item"]')).toHaveLength(1)
  })

  it('shows a skeleton while loading', async () => {
    vi.mocked(activityLogService.listTaskActivityLogs).mockReturnValue(new Promise(() => {}))

    const wrapper = mount(ActivityTimeline, {
      props: {
        source: { type: 'task', id: 42 },
      },
    })
    await flushPromises()

    expect(wrapper.get('[aria-label="Loading activity"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('No activity yet')
  })

  it('shows an empty state when there are no logs', async () => {
    vi.mocked(activityLogService.listUserActivityLogs).mockResolvedValue({
      logs: [],
      meta: { ...meta, total: 0, from: null, to: null },
      message: 'ok',
    })

    const wrapper = mount(ActivityTimeline, {
      props: {
        source: { type: 'user', id: 9 },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('No activity yet')
  })

  it('shows an error with retry', async () => {
    vi.mocked(activityLogService.listProjectActivityLogs)
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
      .mockResolvedValueOnce({
        logs: [sampleLog],
        meta,
        message: 'ok',
      })

    const wrapper = mount(ActivityTimeline, {
      props: {
        source: { type: 'project', id: 3 },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain("Couldn't load activity")
    expect(wrapper.text()).toContain('Unable to load activity.')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('John Reyes assigned task Draft API spec to Maria Lopez')
    expect(activityLogService.listProjectActivityLogs).toHaveBeenCalledTimes(2)
  })

  it('paginates when more than one page exists', async () => {
    vi.mocked(activityLogService.listProjectActivityLogs)
      .mockResolvedValueOnce({
        logs: [sampleLog],
        meta: { ...meta, last_page: 2, total: 11 },
        message: 'ok',
      })
      .mockResolvedValueOnce({
        logs: [{ ...sampleLog, id: 8, description: 'Updated project Website Redesign.' }],
        meta: { ...meta, current_page: 2, last_page: 2, total: 11 },
        message: 'ok',
      })

    const wrapper = mount(ActivityTimeline, {
      props: {
        source: { type: 'project', id: 3 },
      },
    })
    await flushPromises()

    const next = wrapper.findAll('button').find((button) => button.text() === 'Next')
    expect(next).toBeTruthy()
    await next!.trigger('click')
    await flushPromises()

    expect(activityLogService.listProjectActivityLogs).toHaveBeenLastCalledWith(
      3,
      { page: 2, per_page: 10 },
      { quietProgress: true },
    )
  })
})

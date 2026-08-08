import { describe, expect, it, vi } from 'vitest'
import { useRemarkThread } from '@/composables/useRemarkThread'
import type { Remark } from '@/types/remark'

vi.mock('@/services/remarkService', () => ({
  listProjectRemarks: vi.fn(),
  listTaskRemarks: vi.fn(),
  createProjectRemark: vi.fn(),
  createTaskRemark: vi.fn(),
  updateRemark: vi.fn(),
  deleteRemark: vi.fn(),
}))

import * as remarkService from '@/services/remarkService'

const sampleRemark: Remark = {
  id: 1,
  body: 'First remark',
  author: { id: 2, full_name: 'Eli Employee', email: 'eli@opsflow.test' },
  mentions: [],
  can_edit: true,
  can_delete: true,
  created_at: '2026-08-08T02:15:00.000000Z',
  updated_at: '2026-08-08T02:15:00.000000Z',
  deleted_at: null,
}

const meta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1,
}

describe('useRemarkThread', () => {
  it('loads project remarks quietly', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })

    const thread = useRemarkThread({ type: 'project', id: 3 })
    await thread.load()

    expect(remarkService.listProjectRemarks).toHaveBeenCalledWith(
      3,
      { page: 1, per_page: 15, direction: 'asc' },
      { quietProgress: true },
    )
    expect(thread.remarks.value).toEqual([sampleRemark])
    expect(thread.isEmpty.value).toBe(false)
  })

  it('creates a remark and reloads without requiring a parent refetch callback', async () => {
    vi.mocked(remarkService.createProjectRemark).mockResolvedValue({
      ...sampleRemark,
      id: 2,
      body: 'Second',
    })
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark, { ...sampleRemark, id: 2, body: 'Second' }],
      meta: { ...meta, total: 2, to: 2 },
      message: 'ok',
    })

    const thread = useRemarkThread({ type: 'project', id: 3 })
    await thread.create({ body: 'Second', mentioned_user_ids: [] })

    expect(remarkService.createProjectRemark).toHaveBeenCalled()
    expect(remarkService.listProjectRemarks).toHaveBeenCalled()
    expect(thread.remarks.value).toHaveLength(2)
  })

  it('updates a remark in place', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })
    vi.mocked(remarkService.updateRemark).mockResolvedValue({
      ...sampleRemark,
      body: 'Edited',
    })

    const thread = useRemarkThread({ type: 'project', id: 3 })
    await thread.load()
    await thread.update(1, { body: 'Edited', mentioned_user_ids: [] })

    expect(thread.remarks.value[0]?.body).toBe('Edited')
  })

  it('removes a remark after delete', async () => {
    vi.mocked(remarkService.listTaskRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })
    vi.mocked(remarkService.deleteRemark).mockResolvedValue()

    const thread = useRemarkThread({ type: 'task', id: 42 })
    await thread.load()
    await thread.remove(1)

    expect(remarkService.deleteRemark).toHaveBeenCalledWith(1)
    expect(thread.remarks.value).toEqual([])
  })

  it('surfaces load errors with retry support', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockRejectedValue({
      response: { status: 500, data: { message: 'Boom' } },
    })

    const thread = useRemarkThread({ type: 'project', id: 3 })
    await thread.load()

    expect(thread.errorMessage.value).toBeTruthy()
    expect(thread.remarks.value).toEqual([])

    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })
    await thread.retry()
    expect(thread.remarks.value).toHaveLength(1)
  })
})

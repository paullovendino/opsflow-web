import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as remarkService from '@/services/remarkService'
import http from '@/services/http'

vi.mock('@/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('remarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists project remarks quietly by default', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [{ id: 1, body: 'Hello' }],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
      },
    })

    const result = await remarkService.listProjectRemarks(3, { page: 1 })

    expect(http.get).toHaveBeenCalledWith('/api/v1/projects/3/remarks', {
      params: { page: 1 },
      quietProgress: true,
    })
    expect(result.remarks).toHaveLength(1)
  })

  it('creates a task remark', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: {
        success: true,
        message: 'created',
        data: { id: 9, body: 'Note' },
        meta: null,
      },
    })

    const remark = await remarkService.createTaskRemark(42, {
      body: 'Note',
      mentioned_user_ids: [2],
    })

    expect(http.post).toHaveBeenCalledWith('/api/v1/tasks/42/remarks', {
      body: 'Note',
      mentioned_user_ids: [2],
    })
    expect(remark.id).toBe(9)
  })

  it('updates and deletes remarks', async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: {
        success: true,
        message: 'updated',
        data: { id: 9, body: 'Edited' },
        meta: null,
      },
    })
    vi.mocked(http.delete).mockResolvedValue({
      data: { success: true, message: 'deleted', data: null, meta: null },
    })

    await remarkService.updateRemark(9, { body: 'Edited', mentioned_user_ids: [] })
    await remarkService.deleteRemark(9)

    expect(http.put).toHaveBeenCalledWith('/api/v1/remarks/9', {
      body: 'Edited',
      mentioned_user_ids: [],
    })
    expect(http.delete).toHaveBeenCalledWith('/api/v1/remarks/9')
  })
})

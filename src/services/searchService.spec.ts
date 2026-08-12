import { describe, expect, it, vi } from 'vitest'
import * as searchService from '@/services/searchService'
import http from '@/services/http'

vi.mock('@/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('searchService', () => {
  it('calls GET /api/v1/search with quietProgress by default', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Search completed successfully.',
        data: { users: [], projects: [], tasks: [] },
        errors: null,
        meta: { q: 'op', per_type: 5, users_returned: 0, projects_returned: 0, tasks_returned: 0 },
      },
    })

    const result = await searchService.search({ q: 'op' })

    expect(http.get).toHaveBeenCalledWith(
      '/api/v1/search',
      expect.objectContaining({
        params: { q: 'op' },
        quietProgress: true,
      }),
    )
    expect(result.results).toEqual({ users: [], projects: [], tasks: [] })
    expect(result.meta.q).toBe('op')
  })
})

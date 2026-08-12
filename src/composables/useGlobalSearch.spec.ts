import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import * as searchService from '@/services/searchService'
import type { SearchResults } from '@/types/search'
import { SEARCH_DEBOUNCE_MS } from '@/types/search'

vi.mock('@/services/searchService', () => ({
  search: vi.fn(),
}))

const empty: SearchResults = { users: [], projects: [], tasks: [] }

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(searchService.search).mockResolvedValue({
      results: empty,
      meta: { q: 'op', per_type: 5, users_returned: 0, projects_returned: 0, tasks_returned: 0 },
      message: 'ok',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not request the API below the minimum query length', async () => {
    const search = useGlobalSearch()
    search.query.value = 'p'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(searchService.search).not.toHaveBeenCalled()
    expect(search.meetsMinLength.value).toBe(false)
  })

  it('debounces and searches when the query reaches two characters', async () => {
    const search = useGlobalSearch()
    search.query.value = 'pr'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 50)
    expect(searchService.search).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)
    await flushPromises()

    expect(searchService.search).toHaveBeenCalledTimes(1)
    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'pr' }),
      expect.objectContaining({ quietProgress: true }),
    )
    expect(search.hasSearched.value).toBe(true)
  })

  it('tracks loading and empty results', async () => {
    let resolveSearch: ((value: Awaited<ReturnType<typeof searchService.search>>) => void) | undefined
    vi.mocked(searchService.search).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve
        }),
    )

    const search = useGlobalSearch()
    search.query.value = 'ops'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)

    expect(search.isLoading.value).toBe(true)

    resolveSearch?.({
      results: empty,
      meta: { q: 'ops', per_type: 5, users_returned: 0, projects_returned: 0, tasks_returned: 0 },
      message: 'ok',
    })
    await flushPromises()

    expect(search.isLoading.value).toBe(false)
    expect(search.isEmpty.value).toBe(true)
    expect(search.hasSearched.value).toBe(true)
  })

  it('stores grouped results on success', async () => {
    vi.mocked(searchService.search).mockResolvedValue({
      results: {
        users: [{ id: 1, full_name: 'Ada', email: 'ada@test', status: 'active', type: 'user' }],
        projects: [{ id: 2, name: 'Ops', status: 'active', progress: 50, type: 'project' }],
        tasks: [
          {
            id: 3,
            title: 'Draft',
            status: 'todo',
            priority: 'medium',
            due_date: null,
            is_overdue: false,
            project: { id: 2, name: 'Ops' },
            type: 'task',
          },
        ],
      },
      meta: { q: 'op', per_type: 5, users_returned: 1, projects_returned: 1, tasks_returned: 1 },
      message: 'ok',
    })

    const search = useGlobalSearch()
    search.query.value = 'op'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(search.results.value.projects).toHaveLength(1)
    expect(search.results.value.tasks).toHaveLength(1)
    expect(search.results.value.users).toHaveLength(1)
  })

  it('captures API errors', async () => {
    vi.mocked(searchService.search).mockRejectedValue({
      response: {
        status: 500,
        data: { success: false, message: 'Search failed.', data: null, errors: null, meta: null },
      },
      message: 'Request failed',
    })

    const search = useGlobalSearch()
    search.query.value = 'op'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(search.errorMessage.value).toBe('Search failed.')
    expect(search.hasSearched.value).toBe(true)
  })

  it('clears query and results', async () => {
    const search = useGlobalSearch()
    search.query.value = 'op'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    search.clear()

    expect(search.query.value).toBe('')
    expect(search.hasSearched.value).toBe(false)
    expect(search.results.value).toEqual(empty)
  })

  it('omits users type when canSearchUsers is false', async () => {
    const search = useGlobalSearch({ canSearchUsers: () => false })
    search.query.value = 'op'
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({ types: 'projects,tasks' }),
      expect.any(Object),
    )
  })
})

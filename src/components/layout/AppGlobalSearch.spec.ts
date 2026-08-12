import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppGlobalSearch from '@/components/layout/AppGlobalSearch.vue'
import { useAuthStore } from '@/stores/auth'
import * as searchService from '@/services/searchService'
import type { AuthUser } from '@/types/auth'
import { SEARCH_DEBOUNCE_MS } from '@/types/search'
import { shouldTrackHttpProgress } from '@/utils/httpProgress'

vi.mock('@/services/searchService', () => ({
  search: vi.fn(),
}))

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const admin: AuthUser = {
  id: 1,
  first_name: 'Ada',
  middle_name: null,
  last_name: 'Admin',
  full_name: 'Ada Admin',
  email: 'ada@opsflow.test',
  avatar: null,
  status: 'active',
  last_login_at: null,
  role: { id: 1, name: 'administrator', description: null },
  department: null,
  job_title: null,
}

const employee: AuthUser = {
  ...admin,
  id: 3,
  first_name: 'Eli',
  last_name: 'Employee',
  full_name: 'Eli Employee',
  email: 'eli@opsflow.test',
  role: { id: 3, name: 'employee', description: null },
}

async function mountSearch(user: AuthUser = admin) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/projects/:id', name: 'projects.show', component: { template: '<div />' } },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
      { path: '/users/:id', name: 'users.show', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(user)

  const wrapper = mount(AppGlobalSearch, {
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  })

  return { wrapper, router }
}

describe('AppGlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(searchService.search).mockResolvedValue({
      results: {
        users: [{ id: 9, full_name: 'Sam User', email: 'sam@opsflow.test', status: 'active', type: 'user' }],
        projects: [{ id: 2, name: 'OpsFlow Launch', status: 'active', progress: 40, type: 'project' }],
        tasks: [
          {
            id: 4,
            title: 'Draft API',
            status: 'todo',
            priority: 'high',
            due_date: null,
            is_overdue: false,
            project: { id: 2, name: 'OpsFlow Launch' },
            type: 'task',
          },
        ],
      },
      meta: { q: 'op', per_type: 5, users_returned: 1, projects_returned: 1, tasks_returned: 1 },
      message: 'ok',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('shows a minimum-length hint without calling the API', async () => {
    const { wrapper } = await mountSearch()
    const input = wrapper.get('[data-test="global-search-input"]')
    await input.setValue('p')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(searchService.search).not.toHaveBeenCalled()
    expect(wrapper.get('[data-test="global-search-status"]').text()).toContain('2 characters')
  })

  it('renders grouped results after a debounced search', async () => {
    const { wrapper } = await mountSearch()
    await wrapper.get('[data-test="global-search-input"]').setValue('op')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(wrapper.find('[data-test="global-search-projects"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="global-search-tasks"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="global-search-users"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('OpsFlow Launch')
    expect(wrapper.text()).toContain('Draft API')
  })

  it('does not render the Users group for employees', async () => {
    const { wrapper } = await mountSearch(employee)
    await wrapper.get('[data-test="global-search-input"]').setValue('op')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    expect(searchService.search).toHaveBeenCalledWith(
      expect.objectContaining({ types: 'projects,tasks' }),
      expect.any(Object),
    )
    expect(wrapper.find('[data-test="global-search-users"]').exists()).toBe(false)
  })

  it('navigates to project show when a project hit is clicked', async () => {
    const { wrapper, router } = await mountSearch()
    const push = vi.spyOn(router, 'push')
    await wrapper.get('[data-test="global-search-input"]').setValue('op')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    await wrapper.get('[data-test="global-search-project-hit"]').trigger('mousedown')
    await flushPromises()

    expect(push).toHaveBeenCalledWith({ name: 'projects.show', params: { id: 2 } })
  })

  it('clears the query and closes results', async () => {
    const { wrapper } = await mountSearch()
    await wrapper.get('[data-test="global-search-input"]').setValue('op')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    await wrapper.get('[data-test="global-search-clear"]').trigger('click')
    await flushPromises()

    expect((wrapper.get('[data-test="global-search-input"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[data-test="global-search-panel"]').exists()).toBe(false)
  })

  it('closes the panel on Escape', async () => {
    const { wrapper } = await mountSearch()
    await wrapper.get('[data-test="global-search-input"]').setValue('op')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()

    await wrapper.get('[data-test="global-search-input"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-test="global-search-panel"]').exists()).toBe(false)
  })

  it('shows empty and error states', async () => {
    vi.mocked(searchService.search).mockResolvedValueOnce({
      results: { users: [], projects: [], tasks: [] },
      meta: { q: 'zz', per_type: 5, users_returned: 0, projects_returned: 0, tasks_returned: 0 },
      message: 'ok',
    })

    const { wrapper } = await mountSearch()
    await wrapper.get('[data-test="global-search-input"]').setValue('zz')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()
    expect(wrapper.get('[data-test="global-search-status"]').text()).toContain('No results')

    vi.mocked(searchService.search).mockRejectedValueOnce({
      response: {
        status: 500,
        data: { success: false, message: 'Boom', data: null, errors: null, meta: null },
      },
      message: 'fail',
    })
    await wrapper.get('[data-test="global-search-input"]').setValue('oops')
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
    await flushPromises()
    expect(wrapper.get('[data-test="global-search-status"]').text()).toContain('Boom')
  })

  it('uses quiet progress so search does not drive the global progress bar', () => {
    expect(shouldTrackHttpProgress('/api/v1/search', true)).toBe(false)
  })

  it('focuses search with Ctrl/Cmd+K', async () => {
    const { wrapper } = await mountSearch()
    const input = wrapper.get('[data-test="global-search-input"]').element as HTMLInputElement
    const focus = vi.spyOn(input, 'focus')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flushPromises()

    expect(focus).toHaveBeenCalled()
  })
})

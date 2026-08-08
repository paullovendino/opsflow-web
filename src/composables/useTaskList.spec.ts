import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTaskList } from '@/composables/useTaskList'
import type { Task } from '@/types/task'

vi.mock('@/services/taskService', () => ({
  listTasks: vi.fn(),
}))

import * as taskService from '@/services/taskService'

const sampleTask: Task = {
  id: 44,
  title: 'Draft API spec',
  description: null,
  status: 'todo',
  priority: 'urgent',
  due_date: '2026-08-05',
  is_overdue: true,
  project: { id: 3, name: 'Alpha' },
  assignee: null,
  creator: {
    id: 1,
    first_name: 'Ada',
    middle_name: null,
    last_name: 'Admin',
    full_name: 'Ada Admin',
    email: 'ada@opsflow.test',
  },
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z',
}

const meta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1,
}

const Host = defineComponent({
  setup() {
    return useTaskList()
  },
  template: `
    <div>
      <span data-test="empty">{{ isEmpty }}</span>
      <span data-test="loading">{{ isLoading }}</span>
      <span data-test="error">{{ errorMessage ?? '' }}</span>
      <span data-test="count">{{ tasks.length }}</span>
      <span data-test="clear-disabled">{{ hasActiveFilters ? 'no' : 'yes' }}</span>
    </div>
  `,
})

async function mountList(initialPath = '/tasks') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/tasks', name: 'tasks.index', component: Host },
      { path: '/tasks/create', name: 'tasks.create', component: Host },
      { path: '/tasks/:id/edit', name: 'tasks.edit', component: Host },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  const wrapper = mount(Host, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('useTaskList', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is not empty while the initial request is in flight', async () => {
    let resolveList!: (value: { tasks: Task[]; meta: typeof meta; message: string }) => void
    vi.mocked(taskService.listTasks).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    const { wrapper } = await mountList()
    await nextTick()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('true')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')
    expect(wrapper.get('[data-test="clear-disabled"]').text()).toBe('yes')

    resolveList({ tasks: [], meta: { ...meta, total: 0, from: null, to: null }, message: 'OK' })
    await flushPromises()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('false')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('true')
  })

  it('builds priority, overdue, and due-range query params', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [sampleTask],
      meta,
      message: 'OK',
    })

    const { wrapper } = await mountList(
      '/tasks?priority=urgent&overdue=1&due_after=2026-08-01&due_before=2026-08-31',
    )
    await flushPromises()

    expect(taskService.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'urgent',
        overdue: true,
        due_after: '2026-08-01',
        due_before: '2026-08-31',
      }),
    )
    expect(wrapper.get('[data-test="clear-disabled"]').text()).toBe('no')
    expect(wrapper.vm.hasActiveFilters).toBe(true)
  })

  it('clears due and priority filters back to the default query', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [sampleTask],
      meta,
      message: 'OK',
    })

    const { wrapper, router } = await mountList('/tasks?priority=high&overdue=1&due_after=2026-08-01')
    await flushPromises()

    wrapper.vm.clearFilters()
    await flushPromises()

    expect(wrapper.vm.filters.priority).toBe('')
    expect(wrapper.vm.filters.overdue).toBe(false)
    expect(wrapper.vm.filters.due_after).toBe('')
    expect(wrapper.vm.hasActiveFilters).toBe(false)
    expect(router.currentRoute.value.query).toEqual({})
    expect(wrapper.get('[data-test="clear-disabled"]').text()).toBe('yes')
  })

  it('preserves list query when opening a modal alias and does not refetch', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [sampleTask],
      meta: { ...meta, current_page: 2, last_page: 3, total: 16, from: 16, to: 16 },
      message: 'OK',
    })

    const { wrapper, router } = await mountList('/tasks?search=Draft&page=2&priority=urgent')
    await flushPromises()
    expect(taskService.listTasks).toHaveBeenCalledTimes(1)

    wrapper.vm.openModalAlias('tasks.create')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('tasks.create')
    expect(router.currentRoute.value.query).toMatchObject({
      search: 'Draft',
      page: '2',
      priority: 'urgent',
    })
    expect(taskService.listTasks).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.filters.search).toBe('Draft')
    expect(wrapper.vm.filters.page).toBe(2)
  })

  it('exposes a retryable error without inventing empty rows', async () => {
    vi.mocked(taskService.listTasks).mockRejectedValue({
      response: {
        status: 500,
        data: {
          success: false,
          message: 'Unable to load tasks.',
          data: null,
          errors: null,
          meta: null,
        },
      },
    })

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.get('[data-test="error"]').text()).toBe('Unable to load tasks.')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')
    expect(wrapper.get('[data-test="count"]').text()).toBe('0')
  })
})

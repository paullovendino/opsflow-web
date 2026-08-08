import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import TaskListView from '@/modules/tasks/views/TaskListView.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'
import type { Task } from '@/types/task'
import { taskDueDateLabel } from '@/utils/taskDueDate'

vi.mock('@/services/taskService', () => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  updateTaskAssignment: vi.fn(),
  updateTaskStatus: vi.fn(),
}))

vi.mock('@/services/projectService', () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  listProjectMembers: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

import * as taskService from '@/services/taskService'
import * as projectService from '@/services/projectService'

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

const overdueTask: Task = {
  id: 44,
  title: 'Past due work',
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

async function mountPage(path = '/tasks') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/tasks', name: 'tasks.index', component: TaskListView },
      { path: '/tasks/create', name: 'tasks.create', component: TaskListView },
      { path: '/tasks/:id/edit', name: 'tasks.edit', component: TaskListView },
    ],
  })
  await router.push(path)
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(admin)

  const wrapper = mount(TaskListView, {
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('TaskListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [{ id: 3, name: 'Alpha' }] as never,
      meta,
      message: 'ok',
    })
  })

  it('renders priority, due date, and overdue state', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [overdueTask],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage()

    expect(wrapper.text()).toContain('Past due work')
    expect(wrapper.text()).toContain('Urgent')
    expect(wrapper.text()).toContain(taskDueDateLabel('2026-08-05', true))
    expect(wrapper.get('[data-test="task-filter-clear"]').attributes('disabled')).toBeDefined()
  })

  it('keeps Clear visible and enables it when filters are active', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [overdueTask],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage('/tasks?priority=urgent&overdue=1')
    const clear = wrapper.get('[data-test="task-filter-clear"]')
    expect(clear.exists()).toBe(true)
    expect(clear.attributes('disabled')).toBeUndefined()
  })

  it('opens create modal without remounting or refetching the list', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValue({
      tasks: [overdueTask],
      meta,
      message: 'ok',
    })

    const { wrapper, router } = await mountPage('/tasks?search=Past&page=1')
    expect(taskService.listTasks).toHaveBeenCalledTimes(1)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('tasks.create')
    expect(router.currentRoute.value.query).toMatchObject({ search: 'Past' })
    expect(taskService.listTasks).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Create task')
    expect(wrapper.text()).toContain('Past due work')
  })

  it('shows empty and error states', async () => {
    vi.mocked(taskService.listTasks).mockResolvedValueOnce({
      tasks: [],
      meta: { ...meta, total: 0, from: null, to: null },
      message: 'ok',
    })

    const empty = await mountPage()
    expect(empty.wrapper.text()).toContain('No tasks yet')
    empty.wrapper.unmount()

    vi.mocked(taskService.listTasks).mockRejectedValueOnce({
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

    const errored = await mountPage()
    expect(errored.wrapper.text()).toContain("Couldn't load tasks")
    expect(errored.wrapper.text()).toContain('Try again')
  })
})

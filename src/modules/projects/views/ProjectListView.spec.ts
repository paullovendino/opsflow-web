import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProjectListView from '@/modules/projects/views/ProjectListView.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'
import type { Project } from '@/types/project'

vi.mock('@/services/projectService', () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProjectStatus: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

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

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 3,
    name: 'Alpha',
    description: null,
    status: 'active',
    start_date: null,
    due_date: null,
    progress: 75,
    owner: {
      id: 1,
      first_name: 'Ada',
      middle_name: null,
      last_name: 'Admin',
      full_name: 'Ada Admin',
      email: 'ada@opsflow.test',
    },
    created_at: '2026-08-01T00:00:00.000000Z',
    updated_at: '2026-08-01T00:00:00.000000Z',
    ...overrides,
  }
}

const meta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1,
}

async function mountPage(path = '/projects') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects', name: 'projects.index', component: ProjectListView },
      { path: '/projects/create', name: 'projects.create', component: ProjectListView },
      { path: '/projects/:id/edit', name: 'projects.edit', component: ProjectListView },
      { path: '/projects/:id', name: 'projects.show', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(admin)

  const wrapper = mount(ProjectListView, {
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('ProjectListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders progress percent from the project API', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [project({ progress: 75 })],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.findAll('[data-test="project-progress-fill"]').length).toBeGreaterThan(0)
  })

  it('renders 0% when progress is zero', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [project({ progress: 0 })],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('0%')
    expect(wrapper.text()).not.toContain('No tasks')
  })

  it('renders 100% when all eligible tasks are complete', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [project({ progress: 100 })],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('100%')
  })

  it('renders No tasks when progress is null', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [project({ progress: null })],
      meta,
      message: 'ok',
    })

    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('No tasks')
    expect(wrapper.text()).not.toContain('0%')
  })

  it('shows the list skeleton while loading', async () => {
    vi.mocked(projectService.listProjects).mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountPage()
    expect(wrapper.get('[aria-busy="true"]').exists()).toBe(true)
  })

  it('shows empty and error states', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValueOnce({
      projects: [],
      meta: { ...meta, total: 0, from: null, to: null },
      message: 'ok',
    })

    const empty = await mountPage()
    expect(empty.wrapper.text()).toContain('No projects yet')
    empty.wrapper.unmount()

    vi.mocked(projectService.listProjects).mockRejectedValueOnce({
      response: {
        status: 500,
        data: {
          success: false,
          message: 'Unable to load projects.',
          data: null,
          errors: null,
          meta: null,
        },
      },
    })

    const errored = await mountPage()
    expect(errored.wrapper.text()).toContain("Couldn't load projects")
    expect(errored.wrapper.text()).toContain('Try again')
  })

  it('opens create without refetching the list', async () => {
    vi.mocked(projectService.listProjects).mockResolvedValue({
      projects: [project()],
      meta,
      message: 'ok',
    })

    const { wrapper, router } = await mountPage('/projects?search=Alpha')
    expect(projectService.listProjects).toHaveBeenCalledTimes(1)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('projects.create')
    expect(router.currentRoute.value.query).toMatchObject({ search: 'Alpha' })
    expect(projectService.listProjects).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Alpha')
  })
})

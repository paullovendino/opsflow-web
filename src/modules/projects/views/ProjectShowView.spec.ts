import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProjectShowView from '@/modules/projects/views/ProjectShowView.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'
import type { Project } from '@/types/project'

vi.mock('@/services/projectService', () => ({
  getProject: vi.fn(),
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

const sample: Project = {
  id: 3,
  name: 'Alpha',
  description: 'Launch work',
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
}

async function mountPage(project: Project = sample) {
  vi.mocked(projectService.getProject).mockResolvedValue(project)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects', name: 'projects.index', component: { template: '<div />' } },
      { path: '/projects/:id', name: 'projects.show', component: ProjectShowView },
    ],
  })
  await router.push('/projects/3')
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(admin)

  const wrapper = mount(ProjectShowView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        ProjectMembersPanel: true,
        ProjectTasksPanel: true,
        RemarkThread: true,
        ActivityTimeline: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('ProjectShowView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders derived progress from the project payload', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Project progress')
    expect(wrapper.get('[data-test="project-progress-value"]').text()).toBe('75%')
    expect(wrapper.get('[data-test="project-progress-fill"]').attributes('style')).toContain('width: 75%')
  })

  it('renders No active tasks when progress is null', async () => {
    const wrapper = await mountPage({ ...sample, progress: null })
    expect(wrapper.text()).toContain('No active tasks')
    expect(wrapper.text()).not.toContain('0%')
  })

  it('loads progress from the project show payload, not a per-project task list', async () => {
    await mountPage()
    expect(projectService.getProject).toHaveBeenCalledTimes(1)
    expect(projectService.getProject).toHaveBeenCalledWith(3)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RemarkThread from '@/modules/remarks/components/RemarkThread.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'
import type { Remark } from '@/types/remark'

vi.mock('@/services/remarkService', () => ({
  listProjectRemarks: vi.fn(),
  listTaskRemarks: vi.fn(),
  createProjectRemark: vi.fn(),
  createTaskRemark: vi.fn(),
  updateRemark: vi.fn(),
  deleteRemark: vi.fn(),
}))

vi.mock('@/services/projectService', () => ({
  getProject: vi.fn(),
  listProjectMembers: vi.fn(),
}))

vi.mock('@/services/userService', () => ({
  listUsers: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

import * as remarkService from '@/services/remarkService'
import * as projectService from '@/services/projectService'
import * as userService from '@/services/userService'

const sampleRemark: Remark = {
  id: 1,
  body: 'Kickoff looks good @Ada Admin',
  author: { id: 9, full_name: 'Eli Employee', email: 'eli@opsflow.test' },
  mentions: [{ id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' }],
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

function userFor(role: 'administrator' | 'employee'): AuthUser {
  return {
    id: role === 'employee' ? 9 : 1,
    first_name: 'Test',
    middle_name: null,
    last_name: 'User',
    full_name: 'Test User',
    email: `${role}@opsflow.test`,
    avatar: null,
    status: 'active',
    last_login_at: null,
    role: { id: 1, name: role, description: null },
    department: null,
    job_title: null,
  }
}

async function mountThread(role: 'administrator' | 'employee' = 'employee') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(userFor(role))

  const wrapper = mount(RemarkThread, {
    props: {
      source: { type: 'project', id: 3 },
      projectId: 3,
    },
    global: {
      plugins: [pinia],
    },
  })

  await flushPromises()
  return wrapper
}

describe('RemarkThread', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(projectService.getProject).mockResolvedValue({
      id: 3,
      name: 'Alpha',
      description: null,
      status: 'active',
      start_date: null,
      due_date: null,
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
    })
    vi.mocked(projectService.listProjectMembers).mockResolvedValue([
      {
        id: 9,
        first_name: 'Eli',
        middle_name: null,
        last_name: 'Employee',
        full_name: 'Eli Employee',
        email: 'eli@opsflow.test',
        status: 'active',
        joined_at: '2026-08-01T00:00:00.000000Z',
      },
    ])
    vi.mocked(userService.listUsers).mockResolvedValue({
      users: [],
      meta,
      message: 'ok',
    })
  })

  it('renders remarks and hides actions when unauthorized', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [{ ...sampleRemark, can_edit: false, can_delete: false }],
      meta,
      message: 'ok',
    })

    const wrapper = await mountThread()

    expect(wrapper.text()).toContain('Kickoff looks good')
    expect(wrapper.text()).toContain('Eli Employee')
    expect(wrapper.find('[data-test="remark-mention"]').text()).toBe('@Ada Admin')
    expect(wrapper.find('[data-test="remark-actions"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="remark-edit"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="remark-delete"]').exists()).toBe(false)
  })

  it('shows edit and delete actions in the overflow menu when permitted', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })

    const wrapper = await mountThread()

    expect(wrapper.find('[data-test="remark-actions"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="remark-edit"]').exists()).toBe(false)

    await wrapper.get('[data-test="remark-actions"]').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-test="remark-edit"]')).toBeTruthy()
    expect(document.body.querySelector('[data-test="remark-delete"]')).toBeTruthy()
  })

  it('shows a skeleton while loading', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockReturnValue(new Promise(() => {}))

    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().setUser(userFor('employee'))

    const wrapper = mount(RemarkThread, {
      props: {
        source: { type: 'project', id: 3 },
        projectId: 3,
      },
      global: { plugins: [pinia] },
    })
    await flushPromises()

    expect(wrapper.get('[aria-label="Loading remarks"]').exists()).toBe(true)
  })

  it('shows empty state when there are no remarks', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [],
      meta: { ...meta, total: 0, from: null, to: null },
      message: 'ok',
    })

    const wrapper = await mountThread()
    expect(wrapper.text()).toContain('No remarks yet')
  })

  it('shows error with retry', async () => {
    vi.mocked(remarkService.listProjectRemarks)
      .mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Unable to load remarks.',
            data: null,
            errors: null,
            meta: null,
          },
        },
      })
      .mockResolvedValueOnce({
        remarks: [sampleRemark],
        meta,
        message: 'ok',
      })

    const wrapper = await mountThread()
    expect(wrapper.text()).toContain("Couldn't load remarks")

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Kickoff looks good')
    expect(remarkService.listProjectRemarks).toHaveBeenCalledTimes(2)
  })

  it('creates a remark through the service without fetching the parent project again', async () => {
    vi.mocked(remarkService.listProjectRemarks)
      .mockResolvedValueOnce({
        remarks: [],
        meta: { ...meta, total: 0, from: null, to: null },
        message: 'ok',
      })
      .mockResolvedValueOnce({
        remarks: [sampleRemark],
        meta,
        message: 'ok',
      })
    vi.mocked(remarkService.createProjectRemark).mockResolvedValue(sampleRemark)

    const wrapper = await mountThread()
    const projectCallsBefore = vi.mocked(projectService.getProject).mock.calls.length

    const textarea = wrapper.get('textarea')
    await textarea.setValue('Kickoff looks good')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(remarkService.createProjectRemark).toHaveBeenCalledWith(3, {
      body: 'Kickoff looks good',
      mentioned_user_ids: [],
    })
    expect(vi.mocked(projectService.getProject).mock.calls.length).toBe(projectCallsBefore)
    expect(wrapper.text()).toContain('Kickoff looks good')
  })

  it('confirms delete before calling the API', async () => {
    vi.mocked(remarkService.listProjectRemarks).mockResolvedValue({
      remarks: [sampleRemark],
      meta,
      message: 'ok',
    })
    vi.mocked(remarkService.deleteRemark).mockResolvedValue()

    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().setUser(userFor('employee'))

    const wrapper = mount(RemarkThread, {
      props: {
        source: { type: 'project', id: 3 },
        projectId: 3,
      },
      global: { plugins: [pinia] },
      attachTo: document.body,
    })
    await flushPromises()

    await wrapper.get('[data-test="remark-actions"]').trigger('click')
    await flushPromises()

    expect(remarkService.deleteRemark).not.toHaveBeenCalled()
    const deleteItem = document.body.querySelector('[data-test="remark-delete"]') as HTMLButtonElement | null
    expect(deleteItem).toBeTruthy()
    deleteItem!.click()
    await flushPromises()

    expect(document.body.textContent).toContain('Delete remark')

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    const confirm = Array.from(dialog!.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete',
    )
    expect(confirm).toBeTruthy()
    confirm!.click()
    await flushPromises()

    expect(remarkService.deleteRemark).toHaveBeenCalledWith(1)
    wrapper.unmount()
  })
})

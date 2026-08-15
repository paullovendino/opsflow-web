import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DepartmentForm from '@/modules/organization/components/DepartmentForm.vue'
import DepartmentList from '@/modules/organization/components/DepartmentList.vue'
import JobTitleForm from '@/modules/organization/components/JobTitleForm.vue'
import JobTitleList from '@/modules/organization/components/JobTitleList.vue'
import type { Department, JobTitle } from '@/types/organization'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/composables/useToast', () => ({
  useToast: () => toast,
}))

vi.mock('@/composables/useLookups', () => ({
  ensureLookups: vi.fn().mockResolvedValue(undefined),
  useLookups: () => ({
    departmentOptions: [
      { value: 1, label: 'IT' },
      { value: 2, label: 'Finance' },
    ],
  }),
}))

vi.mock('@/services/organizationService', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  updateDepartmentStatus: vi.fn(),
  deleteDepartment: vi.fn(),
  listJobTitles: vi.fn(),
  createJobTitle: vi.fn(),
  updateJobTitle: vi.fn(),
  updateJobTitleStatus: vi.fn(),
  deleteJobTitle: vi.fn(),
}))

import * as organizationService from '@/services/organizationService'
import { ensureLookups } from '@/composables/useLookups'

const emptyMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null as number | null,
  to: null as number | null,
}

const sampleDepartment: Department = {
  id: 1,
  name: 'IT',
  description: null,
  status: 'active',
  job_titles_count: 1,
  users_count: 2,
}

const createdDepartment: Department = {
  id: 2,
  name: 'Accounting',
  description: null,
  status: 'active',
  job_titles_count: 0,
  users_count: 0,
}

const sampleJobTitle: JobTitle = {
  id: 5,
  department_id: 1,
  name: 'Engineer',
  description: null,
  status: 'active',
  users_count: 1,
  department: { id: 1, name: 'IT', status: 'active' },
}

describe('DepartmentList mutation lifecycle', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    vi.mocked(organizationService.listDepartments).mockResolvedValue({
      items: [sampleDepartment],
      meta: { ...emptyMeta, total: 1, from: 1, to: 1 },
      message: 'ok',
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('refreshes the list before closing the create dialog', async () => {
    let resolveList!: (value: {
      items: Department[]
      meta: typeof emptyMeta
      message: string
    }) => void

    vi.mocked(organizationService.listDepartments)
      .mockResolvedValueOnce({
        items: [sampleDepartment],
        meta: { ...emptyMeta, total: 1, from: 1, to: 1 },
        message: 'ok',
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveList = resolve
          }),
      )

    vi.mocked(organizationService.createDepartment).mockResolvedValue(createdDepartment)

    wrapper = mount(DepartmentList, { attachTo: document.body })
    await flushPromises()

    ;(wrapper.vm as { openCreate: () => void }).openCreate()
    await nextTick()

    const form = wrapper.getComponent(DepartmentForm)
    await form.get('#department_name').setValue('Accounting')
    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createDepartment).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(DepartmentForm).exists()).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()

    resolveList({
      items: [createdDepartment, sampleDepartment],
      meta: { ...emptyMeta, total: 2, from: 1, to: 2 },
      message: 'ok',
    })
    await flushPromises()

    expect(wrapper.findComponent(DepartmentForm).exists()).toBe(false)
    expect(wrapper.text()).toContain('Accounting')
    expect(toast.success).toHaveBeenCalledWith('Department created.')
    expect(organizationService.listDepartments).toHaveBeenCalledTimes(2)
    expect(ensureLookups).toHaveBeenCalledWith({ force: true })
  })

  it('preserves active filters when refreshing after create', async () => {
    vi.mocked(organizationService.createDepartment).mockResolvedValue(createdDepartment)

    wrapper = mount(DepartmentList, { attachTo: document.body })
    await flushPromises()

    await wrapper.get('#filter_department_status').setValue('active')
    await flushPromises()

    ;(wrapper.vm as { openCreate: () => void }).openCreate()
    await nextTick()

    const form = wrapper.getComponent(DepartmentForm)
    await form.get('#department_name').setValue('Accounting')
    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    const refreshCall = vi.mocked(organizationService.listDepartments).mock.calls.at(-1)
    expect(refreshCall?.[0]).toMatchObject({ status: 'active', page: 1 })
  })

  it('keeps the confirm dialog open until list refresh succeeds for deactivate', async () => {
    let resolveList!: (value: {
      items: Department[]
      meta: typeof emptyMeta
      message: string
    }) => void

    vi.mocked(organizationService.listDepartments)
      .mockResolvedValueOnce({
        items: [sampleDepartment],
        meta: { ...emptyMeta, total: 1, from: 1, to: 1 },
        message: 'ok',
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveList = resolve
          }),
      )

    vi.mocked(organizationService.updateDepartmentStatus).mockResolvedValue({
      ...sampleDepartment,
      status: 'inactive',
    })

    wrapper = mount(DepartmentList, { attachTo: document.body })
    await flushPromises()

    const actions = wrapper.findComponent({ name: 'DepartmentActionsMenu' })
    actions.vm.$emit('deactivate', sampleDepartment)
    await nextTick()

    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Deactivate',
    )
    expect(confirmBtn).toBeTruthy()
    confirmBtn!.click()
    await flushPromises()

    expect(organizationService.updateDepartmentStatus).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(
      Array.from(document.body.querySelectorAll('[role="dialog"]')).some((dialog) =>
        dialog.textContent?.includes('Deactivate department'),
      ),
    ).toBe(true)

    resolveList({
      items: [],
      meta: { ...emptyMeta, total: 0 },
      message: 'ok',
    })
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('Department deactivated.')
  })
})

describe('JobTitleList mutation lifecycle', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    vi.mocked(organizationService.listJobTitles).mockResolvedValue({
      items: [sampleJobTitle],
      meta: { ...emptyMeta, total: 1, from: 1, to: 1 },
      message: 'ok',
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('preserves department filter across create refresh', async () => {
    vi.mocked(organizationService.createJobTitle).mockResolvedValue({
      id: 9,
      department_id: 2,
      name: 'Accountant',
      description: null,
      status: 'active',
      users_count: 0,
      department: { id: 2, name: 'Finance', status: 'active' },
    })

    wrapper = mount(JobTitleList, { attachTo: document.body })
    await flushPromises()

    await wrapper.get('#filter_job_title_department').setValue('1')
    await flushPromises()

    ;(wrapper.vm as { openCreate: () => void }).openCreate()
    await nextTick()

    const form = wrapper.getComponent(JobTitleForm)
    await form.get('#job_title_name').setValue('Accountant')
    await form.get('#job_title_department_id').setValue('2')
    await form.get('[data-test="job-title-form"]').trigger('submit.prevent')
    await flushPromises()

    const refreshCall = vi.mocked(organizationService.listJobTitles).mock.calls.at(-1)
    expect(refreshCall?.[0]).toMatchObject({ department_id: 1, page: 1 })
    expect(wrapper.text()).not.toContain('Accountant')
  })
})

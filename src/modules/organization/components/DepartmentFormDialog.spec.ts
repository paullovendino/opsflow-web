import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { reactive } from 'vue'
import DepartmentForm from '@/modules/organization/components/DepartmentForm.vue'
import DepartmentFormDialog from '@/modules/organization/components/DepartmentFormDialog.vue'
import JobTitleForm from '@/modules/organization/components/JobTitleForm.vue'
import JobTitleFormDialog from '@/modules/organization/components/JobTitleFormDialog.vue'
import type { Department, JobTitle } from '@/types/organization'

const toast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/composables/useToast', () => ({
  useToast: () => toast,
}))

vi.mock('@/services/organizationService', () => ({
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  createJobTitle: vi.fn(),
  updateJobTitle: vi.fn(),
}))

import * as organizationService from '@/services/organizationService'

const createdDepartment: Department = {
  id: 10,
  name: 'Accounting',
  description: null,
  status: 'active',
  job_titles_count: 0,
  users_count: 0,
}

const createdJobTitle: JobTitle = {
  id: 20,
  department_id: 2,
  name: 'Accountant',
  description: null,
  status: 'active',
  users_count: 0,
  department: { id: 2, name: 'Finance', status: 'active' },
}

describe('DepartmentFormDialog refresh-before-close', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('keeps the dialog open until afterSave resolves', async () => {
    let resolveAfterSave!: () => void
    const afterSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAfterSave = resolve
        }),
    )

    vi.mocked(organizationService.createDepartment).mockResolvedValue(createdDepartment)

    const state = reactive({ open: true })
    wrapper = mount(DepartmentFormDialog, {
      attachTo: document.body,
      props: {
        open: state.open,
        mode: 'create',
        afterSave,
        onClose: () => {
          state.open = false
        },
      },
    })

    const form = wrapper.getComponent(DepartmentForm)
    await form.get('#department_name').setValue('Accounting')
    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createDepartment).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledWith(createdDepartment)
    expect(form.exists()).toBe(true)
    expect(state.open).toBe(true)

    resolveAfterSave()
    await flushPromises()
  })

  it('does not call create again when retrying after a refresh failure', async () => {
    const afterSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('list failed'))
      .mockResolvedValueOnce(undefined)

    vi.mocked(organizationService.createDepartment).mockResolvedValue(createdDepartment)

    wrapper = mount(DepartmentFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'create',
        afterSave,
      },
    })

    const form = wrapper.getComponent(DepartmentForm)
    await form.get('#department_name').setValue('Accounting')
    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createDepartment).toHaveBeenCalledTimes(1)
    expect(form.text()).toContain('Department was created, but the list could not be refreshed')
    expect(form.text()).toContain('Retry refresh')

    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createDepartment).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledTimes(2)
  })

  it('keeps the dialog open when the create mutation fails', async () => {
    vi.mocked(organizationService.createDepartment).mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Name taken',
          data: null,
          errors: { name: ['Taken'] },
          meta: null,
        },
      },
    })
    const afterSave = vi.fn()

    wrapper = mount(DepartmentFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'create',
        afterSave,
      },
    })

    const form = wrapper.getComponent(DepartmentForm)
    await form.get('#department_name').setValue('Accounting')
    await form.get('[data-test="department-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(afterSave).not.toHaveBeenCalled()
    expect(form.exists()).toBe(true)
    expect(form.text()).toContain('Name taken')
  })
})

describe('JobTitleFormDialog refresh-before-close', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('awaits afterSave before considering the save complete', async () => {
    let resolveAfterSave!: () => void
    const afterSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAfterSave = resolve
        }),
    )
    vi.mocked(organizationService.createJobTitle).mockResolvedValue(createdJobTitle)

    wrapper = mount(JobTitleFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'create',
        departmentOptions: [
          { value: 1, label: 'IT' },
          { value: 2, label: 'Finance' },
        ],
        afterSave,
      },
    })

    const form = wrapper.getComponent(JobTitleForm)
    await form.get('#job_title_name').setValue('Accountant')
    await form.get('#job_title_department_id').setValue('2')
    await form.get('[data-test="job-title-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createJobTitle).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledWith(createdJobTitle)
    expect(form.exists()).toBe(true)

    resolveAfterSave()
    await flushPromises()
  })

  it('retries refresh only after a list refresh failure', async () => {
    const afterSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('list failed'))
      .mockResolvedValueOnce(undefined)
    vi.mocked(organizationService.createJobTitle).mockResolvedValue(createdJobTitle)

    wrapper = mount(JobTitleFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'create',
        departmentOptions: [{ value: 2, label: 'Finance' }],
        afterSave,
      },
    })

    const form = wrapper.getComponent(JobTitleForm)
    await form.get('#job_title_name').setValue('Accountant')
    await form.get('#job_title_department_id').setValue('2')
    await form.get('[data-test="job-title-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(form.text()).toContain('Job title was created, but the list could not be refreshed')

    await form.get('[data-test="job-title-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(organizationService.createJobTitle).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledTimes(2)
  })
})

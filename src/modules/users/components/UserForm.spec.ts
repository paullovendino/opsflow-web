import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import UserForm from '@/modules/users/components/UserForm.vue'
import type { User } from '@/types/user'

vi.mock('@/composables/useLookups', () => ({
  useLookups: () => ({
    roleOptions: ref([
      { value: 1, label: 'Administrator' },
      { value: 2, label: 'Employee' },
    ]),
    departmentOptions: ref([
      { value: 10, label: 'Engineering' },
      { value: 11, label: 'Operations' },
    ]),
    jobTitleOptions: ref([]),
    isLoading: ref(false),
    errorMessage: ref(null),
    ensureLookups: vi.fn(),
  }),
}))

vi.mock('@/services/lookupService', () => ({
  listJobTitlesForDepartment: vi.fn(),
  listRoles: vi.fn(),
  listDepartments: vi.fn(),
  listJobTitles: vi.fn(),
}))

import * as lookupService from '@/services/lookupService'

const baseUser: User = {
  id: 4,
  first_name: 'Ada',
  middle_name: null,
  last_name: 'Admin',
  full_name: 'Ada Admin',
  email: 'ada@opsflow.test',
  avatar: null,
  status: 'active',
  last_login_at: null,
  role: { id: 1, name: 'administrator', description: null },
  department: { id: 10, name: 'Engineering' },
  job_title: { id: 20, name: 'Staff Engineer' },
}

describe('UserForm dependent department/job title select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(lookupService.listJobTitlesForDepartment).mockResolvedValue([
      { id: 20, name: 'Staff Engineer', department_id: 10 },
      { id: 21, name: 'Engineer', department_id: 10 },
    ])
  })

  it('disables job title until a department is selected', async () => {
    const wrapper = mount(UserForm, {
      props: { mode: 'create' },
    })
    await flushPromises()

    const jobTitle = wrapper.get('#job_title_id')
    expect(jobTitle.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Not Assigned')

    await wrapper.get('#department_id').setValue('10')
    await flushPromises()

    expect(lookupService.listJobTitlesForDepartment).toHaveBeenCalledWith(10, null)
    expect(wrapper.get('#job_title_id').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Staff Engineer')
  })

  it('clears job title and reloads when department changes', async () => {
    vi.mocked(lookupService.listJobTitlesForDepartment)
      .mockResolvedValueOnce([
        { id: 20, name: 'Staff Engineer', department_id: 10 },
        { id: 21, name: 'Engineer', department_id: 10 },
      ])
      .mockResolvedValueOnce([{ id: 30, name: 'Analyst', department_id: 11 }])

    const wrapper = mount(UserForm, {
      props: { mode: 'edit', initial: baseUser },
    })
    await flushPromises()

    expect(lookupService.listJobTitlesForDepartment).toHaveBeenCalledWith(10, 20)
    expect((wrapper.get('#job_title_id').element as HTMLSelectElement).value).toBe('20')

    await wrapper.get('#department_id').setValue('11')
    await flushPromises()
    await nextTick()

    expect(lookupService.listJobTitlesForDepartment).toHaveBeenLastCalledWith(11, null)
    expect((wrapper.get('#job_title_id').element as HTMLSelectElement).value).toBe('')
    expect(wrapper.text()).toContain('Analyst')
  })

  it('passes include_id when editing a user with an assigned title', async () => {
    mount(UserForm, {
      props: { mode: 'edit', initial: baseUser },
    })
    await flushPromises()

    expect(lookupService.listJobTitlesForDepartment).toHaveBeenCalledWith(10, 20)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import DepartmentForm from '@/modules/organization/components/DepartmentForm.vue'
import JobTitleForm from '@/modules/organization/components/JobTitleForm.vue'
import DepartmentListView from '@/modules/departments/views/DepartmentListView.vue'
import JobTitleListView from '@/modules/job-titles/views/JobTitleListView.vue'
import type { Department, JobTitle } from '@/types/organization'

vi.mock('@/modules/organization/components/DepartmentList.vue', () => ({
  default: {
    name: 'DepartmentList',
    template: '<div data-test="department-list-stub" />',
    methods: { openCreate() {} },
  },
}))

vi.mock('@/modules/organization/components/JobTitleList.vue', () => ({
  default: {
    name: 'JobTitleList',
    template: '<div data-test="job-title-list-stub" />',
    methods: { openCreate() {} },
  },
}))

vi.mock('@/services/organizationService', () => ({
  listDepartments: vi.fn().mockResolvedValue({
    items: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
  }),
  listJobTitles: vi.fn().mockResolvedValue({
    items: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
  }),
}))

const sampleDepartment: Department = {
  id: 1,
  name: 'Engineering',
  code: 'ENG',
  description: null,
  status: 'active',
  job_titles_count: 2,
  users_count: 4,
}

const sampleJobTitle: JobTitle = {
  id: 3,
  department_id: 1,
  name: 'Software Engineer',
  code: 'SE',
  description: null,
  status: 'active',
  users_count: 2,
  department: sampleDepartment,
}

describe('Administration module pages', () => {
  it('renders the Departments page header', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/departments',
          name: 'departments.index',
          component: DepartmentListView,
        },
      ],
    })
    await router.push({ name: 'departments.index' })
    await router.isReady()

    const wrapper = mount(DepartmentListView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.get('[data-test="departments-page"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Departments')
    expect(wrapper.text()).toContain('Manage the departments available in your organization.')
    expect(wrapper.find('[data-test="create-department"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="department-list-stub"]').exists()).toBe(true)
  })

  it('renders the Job Titles page header', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/job-titles',
          name: 'job-titles.index',
          component: JobTitleListView,
        },
      ],
    })
    await router.push({ name: 'job-titles.index' })
    await router.isReady()

    const wrapper = mount(JobTitleListView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.get('[data-test="job-titles-page"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Job Titles')
    expect(wrapper.text()).toContain('Manage job titles and their department assignments.')
    expect(wrapper.find('[data-test="create-job-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="job-title-list-stub"]').exists()).toBe(true)
  })

  it('emits department create payloads', async () => {
    const wrapper = mount(DepartmentForm, {
      props: { mode: 'create' },
    })

    await wrapper.get('#department_name').setValue('Platform')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { name: 'Platform', description: null },
    ])
  })

  it('requires a department when creating a job title', async () => {
    const wrapper = mount(JobTitleForm, {
      props: {
        mode: 'create',
        departmentOptions: [{ value: 1, label: 'Engineering' }],
        initial: sampleJobTitle,
      },
    })

    await wrapper.get('#job_title_name').setValue('Staff Engineer')
    await wrapper
      .get('#job_title_department_id')
      .setValue('')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Department is required.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

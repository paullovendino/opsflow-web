import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { ensureLookups, resetLookupsCache, useLookups } from '@/composables/useLookups'

vi.mock('@/services/lookupService', () => ({
  listRoles: vi.fn(),
  listDepartments: vi.fn(),
  listJobTitles: vi.fn(),
  listJobTitlesForDepartment: vi.fn(),
}))

import * as lookupService from '@/services/lookupService'

describe('useLookups', () => {
  beforeEach(() => {
    resetLookupsCache()
    vi.clearAllMocks()
    vi.mocked(lookupService.listRoles).mockResolvedValue([
      { id: 1, name: 'administrator', description: null },
    ])
    vi.mocked(lookupService.listDepartments).mockResolvedValue([{ id: 10, name: 'Engineering' }])
    vi.mocked(lookupService.listJobTitles).mockResolvedValue([{ id: 20, name: 'Software Engineer' }])
  })

  it('deduplicates in-flight lookup requests', async () => {
    await Promise.all([ensureLookups(), ensureLookups(), ensureLookups()])

    expect(lookupService.listRoles).toHaveBeenCalledTimes(1)
    expect(lookupService.listDepartments).toHaveBeenCalledTimes(1)
    expect(lookupService.listJobTitles).toHaveBeenCalledTimes(1)
  })

  it('reuses the SPA-session cache on later calls', async () => {
    await ensureLookups()
    await ensureLookups()

    expect(lookupService.listRoles).toHaveBeenCalledTimes(1)

    const Host = defineComponent({
      setup() {
        return useLookups()
      },
      template: `
        <div>
          <span data-test="loaded">{{ hasLoaded }}</span>
          <span data-test="role">{{ roleOptions[0]?.label ?? '' }}</span>
          <span data-test="department">{{ departmentOptions[0]?.label ?? '' }}</span>
          <span data-test="job">{{ jobTitleOptions[0]?.label ?? '' }}</span>
        </div>
      `,
    })

    const wrapper = mount(Host)
    expect(wrapper.get('[data-test="loaded"]').text()).toBe('true')
    expect(wrapper.get('[data-test="role"]').text()).toBe('Administrator')
    expect(wrapper.get('[data-test="department"]').text()).toBe('Engineering')
    expect(wrapper.get('[data-test="job"]').text()).toBe('Software Engineer')
    expect(lookupService.listRoles).toHaveBeenCalledTimes(1)
  })

  it('refetches when force is true', async () => {
    await ensureLookups()
    await ensureLookups({ force: true })

    expect(lookupService.listRoles).toHaveBeenCalledTimes(2)
  })
})

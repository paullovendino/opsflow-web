import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardAverageProgress from '@/modules/dashboard/components/DashboardAverageProgress.vue'

describe('DashboardAverageProgress', () => {
  it('renders a 75% progress meter', () => {
    const wrapper = mount(DashboardAverageProgress, { props: { progress: 75 } })

    expect(wrapper.get('[data-test="project-progress-value"]').text()).toContain('75%')
    expect(wrapper.find('[data-test="average-progress-empty"]').exists()).toBe(false)
  })

  it('renders 0% without treating it as empty', () => {
    const wrapper = mount(DashboardAverageProgress, { props: { progress: 0 } })

    expect(wrapper.get('[data-test="project-progress-value"]').text()).toContain('0%')
    expect(wrapper.find('[data-test="average-progress-empty"]').exists()).toBe(false)
  })

  it('shows the null empty state copy', () => {
    const wrapper = mount(DashboardAverageProgress, { props: { progress: null } })

    expect(wrapper.get('[data-test="average-progress-empty"]').text()).toBe('No active project progress')
    expect(wrapper.find('[data-test="project-progress-bar"]').exists()).toBe(false)
  })
})

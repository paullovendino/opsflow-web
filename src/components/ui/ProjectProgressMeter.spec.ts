import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectProgressMeter from '@/components/ui/ProjectProgressMeter.vue'

describe('ProjectProgressMeter', () => {
  it('renders 0% with an empty fill', () => {
    const wrapper = mount(ProjectProgressMeter, { props: { progress: 0 } })
    expect(wrapper.get('[data-test="project-progress-value"]').text()).toBe('0%')
    expect(wrapper.get('[data-test="project-progress-fill"]').attributes('style')).toContain('width: 0%')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
  })

  it('renders 100% with a full fill', () => {
    const wrapper = mount(ProjectProgressMeter, { props: { progress: 100 } })
    expect(wrapper.get('[data-test="project-progress-value"]').text()).toBe('100%')
    expect(wrapper.get('[data-test="project-progress-fill"]').attributes('style')).toContain('width: 100%')
  })

  it('renders 75% fill width', () => {
    const wrapper = mount(ProjectProgressMeter, { props: { progress: 75 } })
    expect(wrapper.get('[data-test="project-progress-value"]').text()).toBe('75%')
    expect(wrapper.get('[data-test="project-progress-fill"]').attributes('style')).toContain('width: 75%')
  })

  it('renders No tasks for null progress in compact mode', () => {
    const wrapper = mount(ProjectProgressMeter, { props: { progress: null, compact: true } })
    expect(wrapper.get('[data-test="project-progress-empty"]').text()).toBe('No tasks')
    expect(wrapper.find('[data-test="project-progress-bar"]').exists()).toBe(false)
  })

  it('renders No active tasks for null progress on the show layout', () => {
    const wrapper = mount(ProjectProgressMeter, { props: { progress: null } })
    expect(wrapper.get('[data-test="project-progress-empty"]').text()).toBe('No active tasks')
  })
})

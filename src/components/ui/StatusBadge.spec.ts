import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/ui/StatusBadge.vue'

describe('StatusBadge', () => {
  it('humanizes status labels', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'in_progress' } })
    expect(wrapper.text()).toContain('In Progress')
  })

  it('humanizes priority labels', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'urgent', kind: 'priority' } })
    expect(wrapper.text()).toContain('Urgent')
  })
})

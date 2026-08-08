import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

describe('AppEmptyState', () => {
  it('renders title, description, and optional action', () => {
    const wrapper = mount(AppEmptyState, {
      props: { title: 'No users yet', description: 'Create the first user.' },
      slots: { action: '<button type="button">Create user</button>' },
    })

    expect(wrapper.text()).toContain('No users yet')
    expect(wrapper.text()).toContain('Create the first user.')
    expect(wrapper.get('button').text()).toBe('Create user')
  })
})

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'

describe('AppPageHeader', () => {
  it('renders title and optional description consistently', () => {
    const wrapper = mount(AppPageHeader, {
      props: {
        title: 'Users',
        description: 'Manage users and their access.',
      },
    })

    expect(wrapper.get('h1').text()).toBe('Users')
    expect(wrapper.get('h1').classes()).toContain('text-2xl')
    expect(wrapper.get('h1').classes()).toContain('text-fg')
    expect(wrapper.get('p').text()).toBe('Manage users and their access.')
    expect(wrapper.get('p').classes()).toContain('text-fg-subtle')
  })

  it('renders actions when provided', () => {
    const wrapper = mount(AppPageHeader, {
      props: { title: 'Tasks' },
      slots: {
        actions: '<button type="button">Create task</button>',
      },
    })

    expect(wrapper.get('button').text()).toBe('Create task')
    expect(wrapper.find('p').exists()).toBe(false)
  })
})

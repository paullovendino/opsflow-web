import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppAvatar from '@/components/ui/AppAvatar.vue'

describe('AppAvatar', () => {
  it('renders initials when avatar is missing', () => {
    const wrapper = mount(AppAvatar, { props: { name: 'Ada Admin' } })

    expect(wrapper.get('[data-test="app-avatar-initials"]').text()).toBe('AA')
    expect(wrapper.find('[data-test="app-avatar-image"]').exists()).toBe(false)
  })

  it('renders an image for http avatar URLs', () => {
    const wrapper = mount(AppAvatar, {
      props: {
        name: 'Ada Admin',
        avatar: 'https://cdn.opsflow.test/a.png',
      },
    })

    expect(wrapper.get('[data-test="app-avatar-image"]').attributes('src')).toBe(
      'https://cdn.opsflow.test/a.png',
    )
  })

  it('falls back to initials when the image fails to load', async () => {
    const wrapper = mount(AppAvatar, {
      props: {
        name: 'Ada Admin',
        avatar: 'https://cdn.opsflow.test/missing.png',
      },
    })

    await wrapper.get('[data-test="app-avatar-image"]').trigger('error')

    expect(wrapper.find('[data-test="app-avatar-image"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="app-avatar-initials"]').text()).toBe('AA')
  })
})

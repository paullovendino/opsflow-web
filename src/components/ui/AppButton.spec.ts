import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/ui/AppButton.vue'

describe('AppButton', () => {
  it('renders the slot label', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Save' } })
    expect(wrapper.text()).toContain('Save')
    expect(wrapper.attributes('aria-busy')).toBe('false')
  })

  it('shows loading state and disables the button', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true, loadingLabel: 'Saving…' },
      slots: { default: 'Save' },
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Saving…')
  })

  it('matches shared control height', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Save' } })
    expect(wrapper.classes()).toContain('h-10')
  })
})

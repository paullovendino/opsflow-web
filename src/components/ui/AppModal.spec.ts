import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '@/components/ui/AppModal.vue'

describe('AppModal', () => {
  it('does not render when closed', () => {
    const wrapper = mount(AppModal, {
      props: { open: false, title: 'Create user' },
      attachTo: document.body,
    })

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('renders and closes on Escape when open', async () => {
    const wrapper = mount(AppModal, {
      props: { open: true, title: 'Create user' },
      slots: { default: '<p>Form</p>' },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('Create user')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })
})

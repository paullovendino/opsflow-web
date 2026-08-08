import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

describe('AppConfirmDialog', () => {
  it('emits confirm and cancel', async () => {
    const wrapper = mount(AppConfirmDialog, {
      props: {
        open: true,
        title: 'Delete user?',
        description: 'This cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'danger',
      },
      attachTo: document.body,
    })

    const buttons = wrapper.findAllComponents(AppButton)
    expect(buttons).toHaveLength(2)
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })

  it('disables cancel while loading', () => {
    const wrapper = mount(AppConfirmDialog, {
      props: {
        open: true,
        title: 'Delete user?',
        loading: true,
      },
      attachTo: document.body,
    })

    const cancel = wrapper.findAllComponents(AppButton)[0]!
    expect(cancel.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

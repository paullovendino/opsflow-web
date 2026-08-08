import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '@/components/ui/AppSelect.vue'

describe('AppSelect', () => {
  it('emits numeric option values', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        id: 'role',
        label: 'Role',
        modelValue: null,
        placeholder: 'Select a role',
        optional: true,
        options: [
          { value: 1, label: 'Administrator' },
          { value: 2, label: 'Employee' },
        ],
      },
    })

    await wrapper.get('select').setValue('1')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  it('disables the select when loading lookups', () => {
    const wrapper = mount(AppSelect, {
      props: {
        id: 'role',
        label: 'Role',
        modelValue: null,
        disabled: true,
        options: [],
      },
    })

    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
  })
})

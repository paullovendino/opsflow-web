import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/ui/AppInput.vue'

describe('AppInput', () => {
  it('emits updates and shows field errors', async () => {
    const wrapper = mount(AppInput, {
      props: {
        id: 'email',
        label: 'Email',
        modelValue: '',
        error: 'Email is required.',
      },
    })

    expect(wrapper.get('label').text()).toBe('Email')
    expect(wrapper.text()).toContain('Email is required.')

    await wrapper.get('input').setValue('admin@opsflow.test')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['admin@opsflow.test'])
  })
})

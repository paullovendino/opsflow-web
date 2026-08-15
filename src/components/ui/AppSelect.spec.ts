import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '@/components/ui/AppSelect.vue'

const baseProps = {
  id: 'role',
  label: 'Role',
  modelValue: null as string | number | null,
  options: [
    { value: 1, label: 'Administrator' },
    { value: 2, label: 'Employee' },
  ],
}

describe('AppSelect', () => {
  it('renders label, options, and chevron', () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        placeholder: 'Select a role',
        optional: true,
      },
    })

    expect(wrapper.get('label').text()).toBe('Role')
    expect(wrapper.get('label').attributes('for')).toBe('role')
    expect(wrapper.get('select').attributes('id')).toBe('role')
    expect(wrapper.find('[data-test="app-select-chevron"]').exists()).toBe(true)

    const optionTexts = wrapper.findAll('option').map((option) => option.text())
    expect(optionTexts).toEqual(['Select a role', 'Administrator', 'Employee'])
  })

  it('emits numeric option values', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        placeholder: 'Select a role',
        optional: true,
      },
    })

    await wrapper.get('select').setValue('1')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  it('emits null when the empty optional option is selected', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        modelValue: 1,
        optional: true,
        placeholder: 'Any role',
      },
    })

    await wrapper.get('select').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('reflects the current model value', () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        modelValue: 2,
      },
    })

    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('2')
  })

  it('disables the select when loading lookups', () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        disabled: true,
        options: [],
      },
    })

    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
  })

  it('forwards name, required, and aria attributes to the select', () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        name: 'role_id',
        required: true,
      },
      attrs: {
        'aria-describedby': 'role-help',
        'data-test': 'role-select',
      },
    })

    const select = wrapper.get('select')
    expect(select.attributes('name')).toBe('role_id')
    expect(select.attributes('required')).toBeDefined()
    expect(select.attributes('aria-describedby')).toBe('role-help')
    expect(select.attributes('data-test')).toBe('role-select')
  })

  it('keeps layout classes on the field wrapper', () => {
    const wrapper = mount(AppSelect, {
      props: baseProps,
      attrs: {
        class: 'min-w-[10rem] flex-1',
      },
    })

    expect(wrapper.classes()).toContain('min-w-[10rem]')
    expect(wrapper.classes()).toContain('flex-1')
    expect(wrapper.get('select').classes()).not.toContain('flex-1')
  })

  it('shows field errors and error styling', () => {
    const wrapper = mount(AppSelect, {
      props: {
        ...baseProps,
        error: 'Role is required.',
      },
    })

    expect(wrapper.text()).toContain('Role is required.')
    expect(wrapper.get('select').classes()).toContain('border-red-500')
  })

  it('uses shared control height and appearance tokens', () => {
    const wrapper = mount(AppSelect, {
      props: baseProps,
    })

    const select = wrapper.get('select')
    expect(select.classes()).toContain('h-10')
    expect(select.classes()).toContain('appearance-none')
    expect(select.classes()).toContain('bg-input')
    expect(select.classes()).toContain('border-border-strong')
    expect(select.classes()).toContain('text-fg')
    expect(select.classes()).toContain('focus:ring-ring/40')
  })
})

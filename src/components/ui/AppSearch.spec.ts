import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSearch from '@/components/ui/AppSearch.vue'

describe('AppSearch', () => {
  it('emits search input', async () => {
    const wrapper = mount(AppSearch, {
      props: { modelValue: '', label: 'Search users', placeholder: 'Search…' },
    })

    await wrapper.get('[data-test="app-search-input"]').setValue('ada')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['ada'])
  })

  it('renders a centered search icon and shared control tokens', () => {
    const wrapper = mount(AppSearch, {
      props: { modelValue: '', label: 'Search' },
    })

    expect(wrapper.find('[data-test="app-search-icon"]').exists()).toBe(true)
    expect(wrapper.get('label').text()).toBe('Search')

    const input = wrapper.get('[data-test="app-search-input"]')
    expect(input.classes()).toContain('h-10')
    expect(input.classes()).toContain('bg-input')
    expect(input.classes()).toContain('pl-10')
    expect(input.classes()).toContain('placeholder:text-fg-muted')
  })

  it('shows a clear control when there is a value', async () => {
    const wrapper = mount(AppSearch, {
      props: { modelValue: 'ada', label: 'Search' },
    })

    expect(wrapper.find('[data-test="app-search-clear"]').exists()).toBe(true)
    await wrapper.get('[data-test="app-search-clear"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('hides the clear control when empty', () => {
    const wrapper = mount(AppSearch, {
      props: { modelValue: '', label: 'Search' },
    })

    expect(wrapper.find('[data-test="app-search-clear"]').exists()).toBe(false)
  })
})

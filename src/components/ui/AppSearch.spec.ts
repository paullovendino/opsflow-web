import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSearch from '@/components/ui/AppSearch.vue'

describe('AppSearch', () => {
  it('emits search input', async () => {
    const wrapper = mount(AppSearch, {
      props: { modelValue: '', label: 'Search users', placeholder: 'Search…' },
    })

    await wrapper.get('input').setValue('ada')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['ada'])
  })
})

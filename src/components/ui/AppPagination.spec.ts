import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from '@/components/ui/AppPagination.vue'

const meta = {
  current_page: 2,
  last_page: 4,
  per_page: 15,
  total: 40,
  from: 16,
  to: 30,
}

describe('AppPagination', () => {
  it('emits previous and next page changes', async () => {
    const wrapper = mount(AppPagination, { props: { meta } })

    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('change')?.[0]).toEqual([1])
    expect(wrapper.emitted('change')?.[1]).toEqual([3])
  })

  it('disables previous on the first page', () => {
    const wrapper = mount(AppPagination, {
      props: {
        meta: { ...meta, current_page: 1, from: 1, to: 15 },
      },
    })

    expect(wrapper.findAll('button')[0]!.attributes('disabled')).toBeDefined()
  })
})

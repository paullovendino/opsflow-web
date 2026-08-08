import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTable from '@/components/ui/AppTable.vue'

describe('AppTable', () => {
  it('renders head and body slots', () => {
    const wrapper = mount(AppTable, {
      props: { caption: 'Users' },
      slots: {
        head: '<tr><th>Name</th></tr>',
        default: '<tr><td>Ada</td></tr>',
      },
    })

    expect(wrapper.get('caption').text()).toBe('Users')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Ada')
  })
})

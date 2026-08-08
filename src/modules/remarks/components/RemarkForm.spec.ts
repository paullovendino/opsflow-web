import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MentionPicker from '@/modules/remarks/components/MentionPicker.vue'
import RemarkForm from '@/modules/remarks/components/RemarkForm.vue'

const candidates = [
  { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  { id: 2, full_name: 'Eli Employee', email: 'eli@opsflow.test' },
]

describe('MentionPicker', () => {
  it('filters and emits the selected candidate', async () => {
    const wrapper = mount(MentionPicker, {
      props: {
        open: true,
        query: 'Eli',
        candidates,
      },
    })

    expect(wrapper.findAll('[data-test="mention-option"]')).toHaveLength(1)
    await wrapper.get('[data-test="mention-option"]').trigger('mousedown')
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(candidates[1])
  })
})

describe('RemarkForm', () => {
  it('inserts a mention from the picker and submits mention ids', async () => {
    const wrapper = mount(RemarkForm, {
      props: {
        candidates,
      },
    })

    const textarea = wrapper.get('textarea')
    await textarea.setValue('Hello @El')
    await textarea.trigger('keyup')
    await textarea.trigger('click')

    expect(wrapper.find('[data-test="mention-picker"]').exists()).toBe(true)
    await wrapper.get('[data-test="mention-option"]').trigger('mousedown')

    expect((textarea.element as HTMLTextAreaElement).value).toContain('@Eli Employee')

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      body: 'Hello @Eli Employee',
      mentioned_user_ids: [2],
    })
  })

  it('blocks empty submissions with a field error', async () => {
    const wrapper = mount(RemarkForm, {
      props: {
        candidates,
      },
    })

    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Remark cannot be empty.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

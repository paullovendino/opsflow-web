import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'
import { useUiStore } from '@/stores/ui'

describe('AppProgressBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('is hidden when idle', () => {
    const wrapper = mount(AppProgressBar)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-hidden')).toBe('true')
  })

  it('becomes visible during route loading', async () => {
    const ui = useUiStore()
    const wrapper = mount(AppProgressBar)

    ui.setRouteLoading(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="progressbar"]').attributes('aria-hidden')).toBe('false')
  })
})

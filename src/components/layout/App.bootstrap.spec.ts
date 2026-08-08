import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const RouterViewStub = defineComponent({
  name: 'RouterView',
  template: '<div>routed</div>',
})

describe('App bootstrap', () => {
  it('shows the auth bootstrap spinner until bootstrapped', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    auth.isBootstrapped = false

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: { RouterView: RouterViewStub, AppToastHost: true },
      },
    })

    expect(wrapper.text()).toContain('Starting OpsFlow…')

    auth.isBootstrapped = true
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('routed')
    expect(wrapper.text()).not.toContain('Starting OpsFlow…')
  })
})

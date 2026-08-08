import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

import * as authService from '@/services/authService'

async function mountLogin(beforeMount?: (auth: ReturnType<typeof useAuthStore>) => void) {
  const pinia = createPinia()
  setActivePinia(pinia)
  beforeMount?.(useAuthStore())

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>dash</div>' } },
    ],
  })
  await router.push('/login')
  await router.isReady()

  return {
    router,
    wrapper: mount(LoginView, {
      global: { plugins: [pinia, router] },
    }),
  }
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows inline client validation without calling login', async () => {
    const { wrapper, router } = await mountLogin()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Email is required.')
    expect(wrapper.text()).toContain('Password is required.')
    expect(authService.login).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('maps 422 field errors inline and stays on login', async () => {
    const { wrapper, router } = await mountLogin((auth) => {
      vi.spyOn(auth, 'login').mockRejectedValue({
        response: {
          status: 422,
          data: {
            success: false,
            message: 'The given data was invalid.',
            data: null,
            errors: { email: ['The email has already been taken.'] },
            meta: null,
          },
        },
      })
    })

    await wrapper.get('#email').setValue('ada@opsflow.test')
    await wrapper.get('#password').setValue('password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('The email has already been taken.')
    expect(wrapper.text()).toContain('The given data was invalid.')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('shows invalid credentials inline without leaving login', async () => {
    const { wrapper, router } = await mountLogin((auth) => {
      vi.spyOn(auth, 'login').mockRejectedValue({
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Invalid credentials.',
            data: null,
            errors: null,
            meta: null,
          },
        },
      })
    })

    await wrapper.get('#email').setValue('ada@opsflow.test')
    await wrapper.get('#password').setValue('wrong')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid credentials.')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('redirects to dashboard after a successful login', async () => {
    const user: AuthUser = {
      id: 1,
      first_name: 'Ada',
      middle_name: null,
      last_name: 'Admin',
      full_name: 'Ada Admin',
      email: 'ada@opsflow.test',
      avatar: null,
      status: 'active',
      last_login_at: null,
      role: { id: 1, name: 'administrator', description: null },
      department: null,
      job_title: null,
    }

    vi.mocked(authService.login).mockResolvedValue(user)
    const { wrapper, router } = await mountLogin()

    await wrapper.get('#email').setValue('ada@opsflow.test')
    await wrapper.get('#password').setValue('password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})

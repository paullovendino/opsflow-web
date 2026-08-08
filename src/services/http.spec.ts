import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { AxiosError } from 'axios'
import { http, registerHttpInterceptors } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const push = vi.fn()

vi.mock('@/router', () => ({
  default: {
    currentRoute: { value: { fullPath: '/users', meta: {} } },
    push,
  },
}))

type ResponseInterceptor = {
  rejected?: (error: AxiosError) => Promise<unknown>
}

function responseRejected(): NonNullable<ResponseInterceptor['rejected']> {
  const handlers = (http.interceptors.response as unknown as { handlers: ResponseInterceptor[] }).handlers
  const rejected = handlers[0]?.rejected
  if (!rejected) {
    throw new Error('HTTP response interceptor was not registered.')
  }
  return rejected
}

function interceptorError(status: number | null, url = '/api/v1/users', message?: string): AxiosError {
  return {
    isAxiosError: true,
    message: message ?? 'Request failed',
    name: 'AxiosError',
    config: { url } as AxiosError['config'],
    response:
      status === null
        ? undefined
        : {
            status,
            data: {
              success: false,
              message: message ?? `HTTP ${status}`,
              data: null,
              errors: null,
              meta: null,
            },
            statusText: '',
            headers: {},
            config: { url } as AxiosError['config'],
          },
    toJSON: () => ({}),
  } as AxiosError
}

describe('http interceptors', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    push.mockReset()
    registerHttpInterceptors()
  })

  it('clears auth and redirects to login on 401 outside guest routes', async () => {
    const auth = useAuthStore()
    auth.setUser({
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
    })

    const rejected = responseRejected()

    await expect(rejected(interceptorError(401))).rejects.toBeTruthy()
    expect(auth.isAuthenticated).toBe(false)
    expect(push).toHaveBeenCalledWith({
      name: 'login',
      query: { redirect: '/users' },
    })
  })

  it('does not treat login 401 as a session expiry redirect', async () => {
    await expect(responseRejected()(interceptorError(401, '/api/v1/auth/login', 'Invalid credentials.'))).rejects.toBeTruthy()
    expect(push).not.toHaveBeenCalled()
  })

  it('toasts 429 and 5xx errors', async () => {
    const ui = useUiStore()
    const rejected = responseRejected()

    await expect(rejected(interceptorError(429, '/api/v1/users', 'Too many attempts.'))).rejects.toBeTruthy()
    await expect(rejected(interceptorError(500, '/api/v1/users', 'Server exploded.'))).rejects.toBeTruthy()

    expect(ui.toasts.map((toast) => toast.message)).toEqual(['Too many attempts.', 'Server exploded.'])
  })
})

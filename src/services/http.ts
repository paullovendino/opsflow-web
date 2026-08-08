import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope } from '@/types/api'
import { useUiStore } from '@/stores/ui'
import { shouldTrackHttpProgress } from '@/utils/httpProgress'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function isLoginRequest(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ''
  return url.includes('/api/v1/auth/login')
}

function shouldTrackProgress(config: InternalAxiosRequestConfig | undefined): boolean {
  return shouldTrackHttpProgress(config?.url ?? '', Boolean(config?.quietProgress))
}

let interceptorsRegistered = false

export function registerHttpInterceptors(): void {
  if (interceptorsRegistered) {
    return
  }

  interceptorsRegistered = true

  http.interceptors.request.use((config) => {
    if (shouldTrackProgress(config)) {
      useUiStore().beginHttp()
    }
    return config
  })

  http.interceptors.response.use(
    (response) => {
      if (shouldTrackProgress(response.config)) {
        useUiStore().endHttp()
      }
      return response
    },
    async (error: AxiosError<ApiEnvelope>) => {
      const status = error.response?.status ?? null
      const config = error.config

      if (shouldTrackProgress(config)) {
        useUiStore().endHttp()
      }

      const [{ useAuthStore }, { default: router }] = await Promise.all([
        import('@/stores/auth'),
        import('@/router'),
      ])

      if (status === 401 && !isLoginRequest(config)) {
        const auth = useAuthStore()
        auth.clear()

        if (router.currentRoute.value.meta.guest !== true) {
          void router.push({
            name: 'login',
            query: { redirect: router.currentRoute.value.fullPath },
          })
        }
      }

      if (status === 429) {
        useUiStore().pushToast({
          type: 'error',
          message: error.response?.data?.message || 'Too many attempts. Please try again later.',
        })
      }

      if (status !== null && status >= 500) {
        useUiStore().pushToast({
          type: 'error',
          message: error.response?.data?.message || 'Something went wrong. Please try again.',
        })
      }

      if (status === null && error.message) {
        useUiStore().pushToast({
          type: 'error',
          message: 'Network error. Check your connection and API URL.',
        })
      }

      return Promise.reject(error)
    },
  )
}

export default http

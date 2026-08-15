import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ThemePreference } from '@/types/profile'
import {
  applyResolvedTheme,
  getSystemPrefersDark,
  readStoredThemePreference,
  resolveTheme,
  writeStoredThemePreference,
  type ResolvedTheme,
} from '@/utils/theme'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let toastSeq = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  const isSidebarOpen = ref(false)

  const routeLoading = ref(false)
  const httpPending = ref(0)
  const globalLoadingProgress = ref(0)
  let progressTimer: ReturnType<typeof setInterval> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const themePreference = ref<ThemePreference>(readStoredThemePreference())
  const resolvedTheme = ref<ResolvedTheme>(
    resolveTheme(themePreference.value, getSystemPrefersDark()),
  )
  const isDark = computed(() => resolvedTheme.value === 'dark')

  let systemMedia: MediaQueryList | null = null
  let systemListener: ((event: MediaQueryListEvent) => void) | null = null

  const isGlobalLoading = computed(() => routeLoading.value || httpPending.value > 0)

  function clearProgressTimers(): void {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function startProgressPulse(): void {
    if (progressTimer) return
    progressTimer = setInterval(() => {
      if (!isGlobalLoading.value) return
      const current = globalLoadingProgress.value
      if (current >= 90) return
      globalLoadingProgress.value = Math.min(90, current + Math.max(1, (90 - current) * 0.08))
    }, 200)
  }

  function beginGlobalLoading(): void {
    clearProgressTimers()
    if (globalLoadingProgress.value <= 0) {
      globalLoadingProgress.value = 12
    }
    startProgressPulse()
  }

  function endGlobalLoading(): void {
    if (isGlobalLoading.value) return
    clearProgressTimers()
    globalLoadingProgress.value = 100
    hideTimer = setTimeout(() => {
      globalLoadingProgress.value = 0
      hideTimer = null
    }, 220)
  }

  function setRouteLoading(value: boolean): void {
    routeLoading.value = value
    if (value) beginGlobalLoading()
    else endGlobalLoading()
  }

  function beginHttp(): void {
    httpPending.value += 1
    beginGlobalLoading()
  }

  function endHttp(): void {
    httpPending.value = Math.max(0, httpPending.value - 1)
    endGlobalLoading()
  }

  function pushToast(input: { type: ToastType; message: string; timeoutMs?: number }): void {
    const id = ++toastSeq
    toasts.value.push({
      id,
      type: input.type,
      message: input.message,
    })

    const timeoutMs = input.timeoutMs ?? 4000
    window.setTimeout(() => {
      dismissToast(id)
    }, timeoutMs)
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function openSidebar(): void {
    isSidebarOpen.value = true
  }

  function closeSidebar(): void {
    isSidebarOpen.value = false
  }

  function toggleSidebar(): void {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function detachSystemListener(): void {
    if (systemMedia && systemListener) {
      systemMedia.removeEventListener('change', systemListener)
    }
    systemMedia = null
    systemListener = null
  }

  function recomputeResolvedTheme(systemPrefersDark?: boolean): void {
    const next = resolveTheme(
      themePreference.value,
      systemPrefersDark ?? getSystemPrefersDark(systemMedia),
    )
    resolvedTheme.value = next
    applyResolvedTheme(next)
  }

  function attachSystemListener(): void {
    detachSystemListener()
    if (themePreference.value !== 'system') return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    systemMedia = window.matchMedia('(prefers-color-scheme: dark)')
    systemListener = (event: MediaQueryListEvent) => {
      recomputeResolvedTheme(event.matches)
    }
    systemMedia.addEventListener('change', systemListener)
  }

  function setThemePreference(preference: ThemePreference, options: { persistLocal?: boolean } = {}): void {
    const persistLocal = options.persistLocal ?? true
    themePreference.value = preference
    if (persistLocal) {
      writeStoredThemePreference(preference)
    }
    attachSystemListener()
    recomputeResolvedTheme()
  }

  function initTheme(): void {
    setThemePreference(readStoredThemePreference(), { persistLocal: false })
  }

  function syncThemeFromAuth(preference: ThemePreference | string | null | undefined): void {
    if (preference !== 'light' && preference !== 'dark' && preference !== 'system') {
      return
    }
    if (preference === themePreference.value) {
      attachSystemListener()
      recomputeResolvedTheme()
      return
    }
    setThemePreference(preference)
  }

  return {
    toasts,
    isSidebarOpen,
    routeLoading,
    httpPending,
    globalLoadingProgress,
    isGlobalLoading,
    themePreference,
    resolvedTheme,
    isDark,
    setRouteLoading,
    beginHttp,
    endHttp,
    pushToast,
    dismissToast,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    setThemePreference,
    initTheme,
    syncThemeFromAuth,
    detachSystemListener,
  }
})

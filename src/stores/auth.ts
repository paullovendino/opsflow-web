import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authService from '@/services/authService'
import type { AuthUser, LoginCredentials } from '@/types/auth'
import { toApiClientError } from '@/utils/errors'
import { useUiStore } from '@/stores/ui'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isBootstrapped = ref(false)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const fullName = computed(() => user.value?.full_name ?? '')
  const email = computed(() => user.value?.email ?? '')
  const roleName = computed(() => user.value?.role?.name ?? '')

  function syncThemeFromUser(next: AuthUser | null): void {
    const ui = useUiStore()
    if (next?.theme_preference) {
      ui.syncThemeFromAuth(next.theme_preference)
    }
  }

  function setUser(next: AuthUser | null): void {
    user.value = next
    syncThemeFromUser(next)
  }

  function clear(): void {
    user.value = null
  }

  async function bootstrap(): Promise<void> {
    if (isBootstrapped.value) {
      return
    }

    isLoading.value = true

    try {
      const current = await authService.fetchCurrentUser()
      setUser(current)
    } catch {
      clear()
    } finally {
      isBootstrapped.value = true
      isLoading.value = false
    }
  }

  async function refreshUser(): Promise<void> {
    isLoading.value = true

    try {
      const current = await authService.fetchCurrentUser()
      setUser(current)
    } catch {
      clear()
    } finally {
      isBootstrapped.value = true
      isLoading.value = false
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true

    try {
      const authenticated = await authService.login(credentials)
      setUser(authenticated)
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true

    try {
      await authService.logout()
    } catch (error) {
      // Session may already be gone; still force guest UX.
      toApiClientError(error)
    } finally {
      clear()
      isLoading.value = false
    }
  }

  return {
    user,
    isBootstrapped,
    isLoading,
    isAuthenticated,
    fullName,
    email,
    roleName,
    setUser,
    clear,
    bootstrap,
    refreshUser,
    login,
    logout,
  }
})

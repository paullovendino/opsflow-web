import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/profileService', () => ({
  updateProfile: vi.fn(),
}))

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

import * as profileService from '@/services/profileService'

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
  theme_preference: 'system',
  role: { id: 1, name: 'administrator', description: null },
  department: null,
  job_title: null,
}

function installLocalStorage(): void {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  })
}

describe('useTheme', () => {
  beforeEach(() => {
    installLocalStorage()
    setActivePinia(createPinia())
    document.documentElement.classList.remove('dark')
    vi.clearAllMocks()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
  })

  it('updates local theme for guests without calling the API', async () => {
    const theme = useTheme()
    const ok = await theme.setPreference('dark')

    expect(ok).toBe(true)
    expect(useUiStore().themePreference).toBe('dark')
    expect(profileService.updateProfile).not.toHaveBeenCalled()
  })

  it('persists theme for authenticated users and syncs auth state', async () => {
    const auth = useAuthStore()
    auth.setUser(user)
    vi.mocked(profileService.updateProfile).mockResolvedValue({
      user: { ...user, theme_preference: 'dark' },
      projects: { owned_count: 0, member_count: 0 },
      tasks: { assigned_open: 0, assigned_overdue: 0 },
      recent_activity: [],
    } as never)

    const theme = useTheme()
    const ok = await theme.setPreference('dark')

    expect(ok).toBe(true)
    expect(profileService.updateProfile).toHaveBeenCalledWith(
      { theme_preference: 'dark' },
      { quietProgress: true },
    )
    expect(auth.user?.theme_preference).toBe('dark')
  })

  it('restores the previous preference when the API fails', async () => {
    const auth = useAuthStore()
    auth.setUser(user)
    useUiStore().setThemePreference('light')
    vi.mocked(profileService.updateProfile).mockRejectedValue({
      response: { status: 500, data: { message: 'Server error' } },
    })

    const theme = useTheme()
    const ok = await theme.setPreference('dark')

    expect(ok).toBe(false)
    expect(useUiStore().themePreference).toBe('light')
    expect(useUiStore().toasts.some((toast) => toast.type === 'error')).toBe(true)
  })
})

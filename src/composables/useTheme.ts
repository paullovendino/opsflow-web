import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import * as profileService from '@/services/profileService'
import type { ThemePreference } from '@/types/profile'
import { toApiClientError } from '@/utils/errors'

export function useTheme() {
  const ui = useUiStore()
  const auth = useAuthStore()
  const { themePreference, resolvedTheme, isDark } = storeToRefs(ui)

  async function setPreference(preference: ThemePreference): Promise<boolean> {
    const previous = ui.themePreference
    ui.setThemePreference(preference)

    if (!auth.user) {
      return true
    }

    try {
      const summary = await profileService.updateProfile(
        { theme_preference: preference },
        { quietProgress: true },
      )
      auth.setUser({
        ...auth.user,
        ...summary.user,
        role: summary.user.role ?? auth.user.role,
        department: summary.user.department ?? auth.user.department,
        job_title: summary.user.job_title ?? auth.user.job_title,
      })
      return true
    } catch (error) {
      ui.setThemePreference(previous)
      const apiError = toApiClientError(error)
      ui.pushToast({
        type: 'error',
        message: apiError.message || 'Unable to save theme preference.',
      })
      return false
    }
  }

  return {
    themePreference,
    resolvedTheme,
    isDark,
    setPreference,
    setThemePreference: ui.setThemePreference,
    syncThemeFromAuth: ui.syncThemeFromAuth,
    initTheme: ui.initTheme,
  }
}

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'opsflow.theme_preference'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function readStoredThemePreference(): ThemePreference {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'system'
    }
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(raw)) {
      return raw
    }
  } catch {
    // Ignore storage access errors (private mode, blocked storage).
  }

  return 'system'
}

export function writeStoredThemePreference(preference: ThemePreference): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Ignore storage access errors.
  }
}

export function getSystemPrefersDark(media?: MediaQueryList | null): boolean {
  if (media) {
    return media.matches
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark = getSystemPrefersDark(),
): ResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  return systemPrefersDark ? 'dark' : 'light'
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

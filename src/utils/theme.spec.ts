import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getSystemPrefersDark,
  readStoredThemePreference,
  resolveTheme,
  writeStoredThemePreference,
} from '@/utils/theme'

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

describe('theme utils', () => {
  beforeEach(() => {
    installLocalStorage()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('resolves explicit and system preferences', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
  })

  it('reads and writes localStorage preference', () => {
    expect(readStoredThemePreference()).toBe('system')
    writeStoredThemePreference('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(readStoredThemePreference()).toBe('dark')
  })

  it('applies and removes html.dark', () => {
    applyResolvedTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    applyResolvedTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('detects system preference via matchMedia', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true })
    vi.stubGlobal('matchMedia', matchMedia)
    expect(getSystemPrefersDark()).toBe(true)
  })
})

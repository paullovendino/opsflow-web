import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from '@/stores/ui'
import { THEME_STORAGE_KEY } from '@/utils/theme'

function installLocalStorage(initial: Record<string, string> = {}): void {
  const store = new Map<string, string>(Object.entries(initial))
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

describe('useUiStore theme', () => {
  let listeners: Array<(event: MediaQueryListEvent) => void>

  beforeEach(() => {
    setActivePinia(createPinia())
    installLocalStorage()
    document.documentElement.classList.remove('dark')
    listeners = []

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.push(listener)
        },
        removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((item) => item !== listener)
        },
      })),
    )
  })

  afterEach(() => {
    useUiStore().detachSystemListener()
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('initializes from localStorage and applies resolved theme', () => {
    installLocalStorage({ [THEME_STORAGE_KEY]: 'dark' })
    setActivePinia(createPinia())
    const ui = useUiStore()
    ui.initTheme()

    expect(ui.themePreference).toBe('dark')
    expect(ui.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches preference and persists locally', () => {
    const ui = useUiStore()
    ui.initTheme()
    ui.setThemePreference('light')

    expect(ui.resolvedTheme).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    ui.setThemePreference('dark')
    expect(ui.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('follows OS changes only for system preference', () => {
    const ui = useUiStore()
    ui.setThemePreference('system')
    expect(ui.resolvedTheme).toBe('light')
    expect(listeners).toHaveLength(1)

    listeners[0]!({ matches: true } as MediaQueryListEvent)
    expect(ui.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    ui.setThemePreference('light')
    expect(listeners).toHaveLength(0)
    expect(ui.resolvedTheme).toBe('light')
  })

  it('syncs preference from auth /me without flash when unchanged', () => {
    const ui = useUiStore()
    ui.setThemePreference('system')
    ui.syncThemeFromAuth('system')
    expect(ui.themePreference).toBe('system')

    ui.syncThemeFromAuth('dark')
    expect(ui.themePreference).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})

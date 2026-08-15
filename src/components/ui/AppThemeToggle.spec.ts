import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'
import AppThemeToggle from '@/components/ui/AppThemeToggle.vue'
import type { ThemePreference } from '@/types/profile'

const setPreference = vi.fn(async () => true)
const themePreference = ref<ThemePreference>('system')

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    themePreference,
    setPreference,
  }),
}))

let wrapper: VueWrapper | null = null

function mountToggle() {
  wrapper = mount(AppThemeToggle, {
    attachTo: document.body,
  })
  return wrapper
}

describe('AppThemeToggle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    themePreference.value = 'system'
    setPreference.mockClear()
    setPreference.mockResolvedValue(true)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the Monitor icon for system preference', () => {
    const mounted = mountToggle()

    expect(mounted.find('[data-test="theme-icon-system"]').exists()).toBe(true)
    expect(mounted.find('[data-test="theme-icon-sun"]').exists()).toBe(false)
    expect(mounted.find('[data-test="theme-icon-moon"]').exists()).toBe(false)
    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-label')).toBe('Theme: System')
    expect(mounted.get('[data-test="theme-toggle"]').attributes('title')).toBe('Theme: System')
  })

  it('renders the Sun icon for light preference', () => {
    themePreference.value = 'light'
    const mounted = mountToggle()

    expect(mounted.find('[data-test="theme-icon-sun"]').exists()).toBe(true)
    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-label')).toBe('Theme: Light')
  })

  it('renders the Moon icon for dark preference', () => {
    themePreference.value = 'dark'
    const mounted = mountToggle()

    expect(mounted.find('[data-test="theme-icon-moon"]').exists()).toBe(true)
    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-label')).toBe('Theme: Dark')
  })

  it('opens a dropdown with System, Light, and Dark options', async () => {
    const mounted = mountToggle()

    expect(document.querySelector('[role="menu"]')).toBeNull()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()

    const menu = document.querySelector('[role="menu"]')
    expect(menu).not.toBeNull()
    expect(menu?.textContent).toContain('System')
    expect(menu?.textContent).toContain('Light')
    expect(menu?.textContent).toContain('Dark')
    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-expanded')).toBe('true')
  })

  it('marks the current preference as selected', async () => {
    themePreference.value = 'light'
    const mounted = mountToggle()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()

    const light = document.querySelector('[data-test="theme-option-light"]')
    const system = document.querySelector('[data-test="theme-option-system"]')
    expect(light?.getAttribute('aria-checked')).toBe('true')
    expect(system?.getAttribute('aria-checked')).toBe('false')
    expect(light?.querySelector('[data-test="theme-option-selected"]')).not.toBeNull()
    expect(system?.querySelector('[data-test="theme-option-selected"]')).toBeNull()
  })

  it('selects System, Light, and Dark through the menu and closes after selection', async () => {
    const mounted = mountToggle()

    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('[data-test="theme-option-light"]')?.click()
    await flushPromises()
    expect(setPreference).toHaveBeenLastCalledWith('light')
    expect(document.querySelector('[role="menu"]')).toBeNull()

    themePreference.value = 'light'
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('[data-test="theme-option-dark"]')?.click()
    await flushPromises()
    expect(setPreference).toHaveBeenLastCalledWith('dark')
    expect(document.querySelector('[role="menu"]')).toBeNull()

    themePreference.value = 'dark'
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('[data-test="theme-option-system"]')?.click()
    await flushPromises()
    expect(setPreference).toHaveBeenLastCalledWith('system')
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('does not call setPreference when re-selecting the current preference', async () => {
    const mounted = mountToggle()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()

    document.querySelector<HTMLButtonElement>('[data-test="theme-option-system"]')?.click()
    await flushPromises()

    expect(setPreference).not.toHaveBeenCalled()
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('closes on Escape', async () => {
    const mounted = mountToggle()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()
    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-expanded')).toBe('true')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    await nextTick()

    expect(mounted.get('[data-test="theme-toggle"]').attributes('aria-expanded')).toBe('false')
  })

  it('closes when clicking outside', async () => {
    const mounted = mountToggle()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()
    expect(document.querySelector('[role="menu"]')).not.toBeNull()

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()

    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('supports arrow-key focus movement within the open menu', async () => {
    const mounted = mountToggle()
    await mounted.get('[data-test="theme-toggle"]').trigger('click')
    await nextTick()

    const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    expect(items).toHaveLength(3)
    items[0]?.focus()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(items[1])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(items[2])
  })
})
